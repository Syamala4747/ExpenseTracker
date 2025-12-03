const axios = require('axios');

// Helper to add a timeout to a promise
const withTimeout = (p, ms) => new Promise((resolve, reject) => {
  let finished = false;
  const t = setTimeout(() => {
    if (!finished) {
      finished = true;
      reject(new Error('operation timed out'));
    }
  }, ms);
  Promise.resolve(p).then((v) => {
    if (!finished) {
      finished = true;
      clearTimeout(t);
      resolve(v);
    }
  }).catch((e) => {
    if (!finished) {
      finished = true;
      clearTimeout(t);
      reject(e);
    }
  });
});

// Helper: call external LLM to parse raw text into structured JSON
const callLLM = async (rawText) => {
  const apiKey = process.env.LLM_API_KEY || process.env.LLM_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey) {
    console.warn('LLM_API_KEY not set — skipping LLM parsing');
    return null;
  }

  // Build prompt instructing the LLM to output JSON only with specific schema
  // Include a few small examples so the LLM reliably maps item words to categories (e.g. chicken -> food)
  const system = `You are an assistant that extracts structured receipt information from OCR text. Output ONLY a single JSON object with keys: date (YYYY-MM-DD or null), amount (number or null), currency (e.g., USD/INR or null), vendor (string or null), category (one-word category like groceries, food, transport, utilities, health, entertainment, dining, misc), items (array of objects with {name, qty, price, total}), raw_text (echo input), confidence (0.0-1.0). Strictly output JSON only with no surrounding explanation or commentary.`;
  const examples = `Examples:\nOCR_TEXT:\nChicken 2kg 500\nRice 5kg 250\nTotal 750\n-> {"category":"food","amount":750}\n\nOCR_TEXT:\nTaxi Uber 12.50\nTotal 12.50\n-> {"category":"transport","amount":12.5}\n\nOCR_TEXT:\nParacetamol 2 50\nTotal 50\n-> {"category":"health","amount":50}\n`;
  const user = `OCR_TEXT:\n${rawText.slice(0, 15000)}\n\n${examples}`; // limit size and include examples

  try {
    const resp = await axios.post(apiUrl, {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.0,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // reduce LLM axios timeout (keep it short so server doesn't hang)
      timeout: 8000
    });

    // Debug: log full LLM response for troubleshooting
    try { console.log('LLM response data:', JSON.stringify(resp.data).slice(0, 2000)); } catch(e) { console.log('LLM response (non-serializable)'); }

    // Support OpenAI-style response
    const choice = resp.data && resp.data.choices && resp.data.choices[0];
    const text = (choice && choice.message && choice.message.content) || (resp.data && resp.data.result) || null;
    if (!text) return null;
    // Ensure we parse JSON only
    const jsonStart = text.indexOf('{');
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (e) {
      console.warn('LLM returned non-JSON or unparsable JSON:', e.message);
      return null;
    }
  } catch (err) {
    console.error('LLM call failed:', err && err.message ? err.message : err);
    return null;
  }
};

// Fallback OCR using OCR.space API (no native Tesseract required)
const callOCRSpace = async (buffer, mimetype) => {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      console.warn('OCR_SPACE_API_KEY not set — skipping OCR.space fallback');
      return null;
    }
    const apiUrl = 'https://api.ocr.space/parse/image';
    const prefix = mimetype ? `data:${mimetype};base64,` : 'data:image/jpeg;base64,';
    const base64 = prefix + buffer.toString('base64');
    const params = new URLSearchParams();
    params.append('base64Image', base64);
    params.append('language', 'eng');
    params.append('isTable', 'false');
    // Use short timeout
    const resp = await axios.post(apiUrl, params, {
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 8000
    });
    if (resp.data && resp.data.ParsedResults && resp.data.ParsedResults[0]) {
      return resp.data.ParsedResults[0].ParsedText || '';
    }
    return null;
  } catch (e) {
    // Log details but don't forward OCR.space HTTP errors to the client
    console.warn('OCR.space call failed:', e && e.message ? e.message : e);
    return null;
  }
};

// Simple helper to find amount
const findAmount = (text) => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // look for keywords
  const amountRegex = /(?:total|grand total|amount due|amount|balance due)[:\s]*([\$₹£]?\s*[\d,]+(?:\.\d{1,2})?)/i;
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(amountRegex);
    if (m) {
      const num = m[1].replace(/[,$\s₹£]/g, '');
      const v = parseFloat(num);
      if (!isNaN(v)) return { amount: v, currency: (m[1].includes('₹') ? 'INR' : (m[1].includes('$') ? 'USD' : null)) };
    }
  }
  // fallback: any number with 2 decimals
  const anyNum = text.match(/([\d,]+\.\d{2})/);
  if (anyNum) {
    const num = anyNum[1].replace(/[,]/g,'');
    return { amount: parseFloat(num), currency: null };
  }
  return { amount: null, currency: null };
};

const findDate = (text) => {
  // common date formats
  const dateRegexes = [
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{2}\/\d{2}\/\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{2}-\d{2}-\d{4})/
  ];
  for (const re of dateRegexes) {
    const m = text.match(re);
    if (m) {
      const s = m[1];
      // try to normalize YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [a,b,c] = s.split('/');
        // assume DD/MM/YYYY if day>12 else ambiguous -> return null
        if (parseInt(a,10) > 12) return `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
        return null;
      }
      if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        const [a,b,c] = s.split('-');
        if (parseInt(a,10) > 12) return `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
        return null;
      }
    }
  }
  return null;
};

exports.parseReceipt = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('Parse request received');
  try {
    console.log('Uploaded file info:', { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size });
  } catch (e) { console.log('No file metadata'); }

  // Keep a last OCR error object so we can expose stderr in dev for debugging
  let lastOCRError = null;

  // Try native tesseract binding first (requires system tesseract to be installed)
  try {
    const { spawnSync } = require('child_process');
    // Check CLI presence first — avoid invoking node-tesseract-ocr when `tesseract` isn't on PATH
    let tesseractPresent = true;
    try {
      const where = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['tesseract'], { encoding: 'utf8' });
      if (where.status !== 0 || !where.stdout) {
        tesseractPresent = false;
      }
    } catch (e) {
      tesseractPresent = false;
    }

    // If not found on PATH, check common Windows install location and add it to PATH
    if (!tesseractPresent && process.platform === 'win32') {
      const possiblePath = 'C:\\Program Files\\Tesseract-OCR';
      const fs = require('fs');
      try {
        if (fs.existsSync(possiblePath) && fs.existsSync(require('path').join(possiblePath, 'tesseract.exe'))) {
          // prepend to PATH for this process so node-tesseract-ocr can spawn it
          process.env.PATH = `${possiblePath};${process.env.PATH || ''}`;
          tesseractPresent = true;
          console.log('Added Tesseract install dir to PATH:', possiblePath);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!tesseractPresent) {
      throw new Error('tesseract-not-found');
    }

    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const { execFile } = require('child_process');

    const tmpDir = os.tmpdir();
    // preserve uploaded extension when possible (some image readers are picky)
    let ext = (req.file && req.file.originalname && path.extname(req.file.originalname)) || '.png';
    let writeBuffer = req.file.buffer;
    // Attempt to normalize/convert the image to PNG before OCR — this avoids
    // many tesseract "Error during processing" cases for AVIF/HEIF/odd JPEGs.
    let converted = false;
    if (req.file && req.file.mimetype && req.file.mimetype.startsWith('image')) {
      // Prefer sharp (supports AVIF/modern formats) if available
      try {
        const sharp = require('sharp');
        try {
          const png = await sharp(req.file.buffer).png().toBuffer();
          writeBuffer = png;
          ext = '.png';
          converted = true;
          console.log('Converted upload to PNG via sharp before OCR');
        } catch (se) {
          console.warn('sharp conversion failed, will try Jimp:', se && se.message ? se.message : se);
        }
      } catch (e) {
        // sharp not installed; fall through to try Jimp
      }

      if (!converted) {
        try {
          const Jimp = require('jimp');
          try {
            const img = await Jimp.read(req.file.buffer);
            const png = await img.getBufferAsync(Jimp.MIME_PNG);
            writeBuffer = png;
            ext = '.png';
            converted = true;
            console.log('Converted upload to PNG via Jimp before OCR');
          } catch (je) {
            console.warn('Jimp conversion failed, will use original buffer:', je && je.message ? je.message : je);
          }
        } catch (e) {
          console.warn('Jimp not available, skipping image normalization');
        }
      }
    }

    const tmpPath = path.join(tmpDir, `receipt-${Date.now()}${ext}`);
    await fs.promises.writeFile(tmpPath, writeBuffer);

    console.log('Running native tesseract OCR on', tmpPath);

    // determine tesseract executable: prefer full Program Files path on Windows
    let tesseractCmd = 'tesseract';
    try {
      if (process.platform === 'win32') {
        const pf = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
        if (fs.existsSync(pf)) {
          tesseractCmd = pf;
          console.log('Will use explicit tesseract.exe at', pf);
        } else {
          // try to use 'where' output if present
          try {
            const { spawnSync } = require('child_process');
            const where = spawnSync('where', ['tesseract'], { encoding: 'utf8' });
            if (where.status === 0 && where.stdout) {
              const first = where.stdout.split(/\r?\n/)[0].trim();
              if (first) tesseractCmd = first;
            }
          } catch (e) { /* ignore */ }
        }
      } else {
        try {
          const { spawnSync } = require('child_process');
          const which = spawnSync('which', ['tesseract'], { encoding: 'utf8' });
          if (which.status === 0 && which.stdout) {
            const first = which.stdout.split(/\r?\n/)[0].trim();
            if (first) tesseractCmd = first;
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.warn('Failed to determine tesseract binary path, falling back to "tesseract" command');
    }

    // Execute tesseract to stdout: `tesseract input.png stdout -l eng --oem 1 --psm 3`
    const execTesseract = () => new Promise((resolve, reject) => {
      const args = [tmpPath, 'stdout', '-l', 'eng', '--oem', '1', '--psm', '3'];
      const child = execFile(tesseractCmd, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          // include stderr for debugging
          const e = new Error(err.message || 'tesseract failed');
          e.stderr = stderr;
          e.stdout = stdout;
          return reject(e);
        }
        return resolve(String(stdout || '').trim());
      });
      // safety: if the child doesn't start, attempt to kill after 8s
      const watchdog = setTimeout(() => {
        try { child.kill(); } catch (e) { /* ignore */ }
      }, 8000);
      child.on('exit', () => clearTimeout(watchdog));
    });

    let text = null;
    try {
      text = await withTimeout(execTesseract(), 8000);
      console.log('Native OCR result length:', text ? text.length : 0);
      if (text) console.log('Native OCR sample:', text.slice(0, 1000));
      if (!text) {
        // treat empty output as failure so we go to the cloud fallback
        throw new Error('tesseract produced no output');
      }
    } catch (e) {
      console.warn('Native tesseract execution failed (first attempt):', e && e.message ? e.message : e);
      if (e && e.stderr) console.warn('tesseract stderr:', String(e.stderr).slice(0,2000));
      // Try a fallback run: without explicit -l eng or with TESSDATA_PREFIX set
      try {
        console.log('Attempting fallback tesseract run (no -l eng, TESSDATA_PREFIX if available)');
        const fallbackExec = () => new Promise((resolve, reject) => {
          const argsFallback = [tmpPath, 'stdout', '--oem', '1', '--psm', '3'];
          const env = Object.assign({}, process.env);
          try {
            const possibleTessdata = path.join(path.dirname(tesseractCmd), 'tessdata');
            if (fs.existsSync(possibleTessdata)) env.TESSDATA_PREFIX = possibleTessdata;
          } catch (ex) { /* ignore */ }
          const child = execFile(tesseractCmd, argsFallback, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, env }, (err, stdout, stderr) => {
            if (err) {
              const ee = new Error(err.message || 'tesseract fallback failed');
              ee.stderr = stderr;
              ee.stdout = stdout;
              return reject(ee);
            }
            return resolve(String(stdout || '').trim());
          });
          const watchdog = setTimeout(() => { try { child.kill(); } catch (ex) { /* ignore */ } }, 8000);
          child.on('exit', () => clearTimeout(watchdog));
        });
        text = await withTimeout(fallbackExec(), 8000);
        console.log('Fallback native OCR result length:', text ? text.length : 0);
        if (text) console.log('Fallback native OCR sample:', text.slice(0,1000));
        if (!text) throw new Error('tesseract fallback produced no output');
      } catch (e2) {
        console.warn('Native tesseract fallback failed:', e2 && e2.message ? e2.message : e2);
        if (e2 && e2.stderr) console.warn('tesseract fallback stderr:', String(e2.stderr).slice(0,2000));
        try { await fs.promises.unlink(tmpPath); } catch (ex) { /* ignore */ }
        throw e2; // bubble up to outer catch
      }
    }
    // cleanup (already removed on error above)
    try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }

    // Parse results heuristically
    let vendor = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)[0] || null;
    let { amount, currency } = findAmount(text);
    let date = findDate(text);
    const type = /credited|received|salary|deposit|refund/i.test(text) ? 'income' : 'expense';
    let confidence = (amount ? 0.9 : 0.4);

    // Try to enrich/override via LLM if configured, but don't wait long
    try {
      console.log('Calling LLM to enrich native OCR output (waiting up to 5s)...');
      // wait at most 5s for LLM; otherwise continue with heuristic result
      const llm = await Promise.race([callLLM(text), new Promise((r) => setTimeout(() => r(null), 5000))]);
      console.log('LLM parsed result (native path):', llm);
      if (llm) {
        if (llm.vendor) vendor = llm.vendor;
        if (llm.amount) amount = llm.amount;
        if (llm.currency) currency = llm.currency;
        if (llm.date) date = llm.date;
        if (typeof llm.confidence === 'number') confidence = llm.confidence;
        const category = llm.category || null;
        const items = Array.isArray(llm.items) ? llm.items : [];
        return res.json({ type, date: date || null, amount: amount !== null ? amount : null, currency: currency || null, vendor: vendor || null, category, items, raw_text: text, confidence });
      } else {
        console.log('LLM did not respond in time; returning heuristic result');
      }
    } catch (e) {
      console.warn('LLM enrichment failed (native path):', e && e.message ? e.message : e);
    }

    // LLM didn't provide data in time — return heuristic result with fallback category
    const fallbackCategory = deriveCategoryFromText(text);
    return res.json({ type, date: date || null, amount: amount !== null ? amount : null, currency: currency || null, vendor: vendor || null, category: fallbackCategory, items: [], raw_text: text, confidence });
  } catch (nativeErr) {
    console.warn('Native tesseract OCR not available or failed:', nativeErr.message || nativeErr);
    lastOCRError = {
      phase: 'native',
      message: nativeErr && nativeErr.message ? nativeErr.message : String(nativeErr),
      stderr: nativeErr && nativeErr.stderr ? String(nativeErr.stderr) : null
    };
    // fall through to WASM tesseract fallback
  }

  // If native OCR is not available, skip the tesseract.js WASM fallback in Node
  // to avoid the Wasm runtime aborting the whole process. Instead use OCR.space
  // cloud fallback which is safe for server environments.
  try {
    console.log('Native tesseract not available — attempting OCR.space cloud fallback');
    const ocrText = await callOCRSpace(req.file.buffer, req.file.mimetype);
    if (ocrText && String(ocrText).trim().length > 0) {
      console.log('OCR.space returned text length:', ocrText.length);
      const text = String(ocrText);
      let vendor = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)[0] || null;
      let { amount, currency } = findAmount(text);
      let date = findDate(text);
      const type = /credited|received|salary|deposit|refund/i.test(text) ? 'income' : 'expense';
      let confidence = (amount ? 0.8 : 0.4);
      try {
        console.log('Calling LLM to enrich OCR.space output (waiting up to 5s)...');
        const llm = await Promise.race([callLLM(text), new Promise((r) => setTimeout(() => r(null), 5000))]);
        console.log('LLM parsed result (ocr.space path):', llm);
        if (llm) {
          if (llm.vendor) vendor = llm.vendor;
          if (llm.amount) amount = llm.amount;
          if (llm.currency) currency = llm.currency;
          if (llm.date) date = llm.date;
          if (typeof llm.confidence === 'number') confidence = llm.confidence;
          const category = llm.category || null;
          const items = Array.isArray(llm.items) ? llm.items : [];
          return res.json({ type, date: date || null, amount: amount !== null ? amount : null, currency: currency || null, vendor: vendor || null, category, items, raw_text: text, confidence });
        }
      } catch (e) {
        console.warn('LLM enrichment failed (ocr.space path):', e && e.message ? e.message : e);
      }
      const fallbackCategory = deriveCategoryFromText(text);
      return res.json({ type, date: date || null, amount: amount !== null ? amount : null, currency: currency || null, vendor: vendor || null, category: fallbackCategory, items: [], raw_text: text, confidence });
    }
  } catch (e) {
    console.warn('OCR.space fallback failed:', e && e.message ? e.message : e);
    lastOCRError = lastOCRError || {
      phase: 'ocr.space',
      message: e && e.message ? e.message : String(e),
      stderr: e && e.stderr ? String(e.stderr) : null
    };
  }

  // Return helpful debugging info in development only
  const baseResp = { message: 'OCR engine unavailable. Please install Tesseract on the server or configure a cloud OCR provider.' };
  if (process.env.NODE_ENV !== 'production' && lastOCRError) {
    baseResp.debug = lastOCRError;
  }
  return res.status(503).json(baseResp);
};

// Simple keyword-based category fallback when LLM is unavailable or times out
const deriveCategoryFromText = (text) => {
  if (!text) return null;
  const s = text.toLowerCase();
  const foodWords = ['chicken','mutton','beef','fish','rice','bread','grocery','groceries','bakery','vegetable','fruit','dairy','restaurant','diner','meal','biryani','kitchen','pizza','burger','cafe'];
  const transportWords = ['taxi','uber','ola','cab','bus','train','metro','ticket'];
  const healthWords = ['pharmacy','paracetamol','ibuprofen','tablet','medicine','hospital','clinic'];
  const utilitiesWords = ['electric','electricity','water','gas','bill','internet','broadband'];
  const entertainmentWords = ['movie','netflix','prime','amazon prime','concert','theatre','cinema'];

  if (foodWords.some(w => s.includes(w))) return 'food';
  if (transportWords.some(w => s.includes(w))) return 'transport';
  if (healthWords.some(w => s.includes(w))) return 'health';
  if (utilitiesWords.some(w => s.includes(w))) return 'utilities';
  if (entertainmentWords.some(w => s.includes(w))) return 'entertainment';
  return 'misc';
};
