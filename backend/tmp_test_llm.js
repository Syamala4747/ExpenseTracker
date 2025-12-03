const axios = require('axios');

const apiKey = process.env.LLM_API_KEY || process.env.LLM_KEY;
const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';

if (!apiKey) {
  console.error('LLM_API_KEY not set in environment. Exiting.');
  process.exit(1);
}

const rawText = `Chicken 2kg 500\nRice 5kg 250\nTotal 750`;

const system = `You are an assistant that extracts structured receipt information from OCR text. Output ONLY a single JSON object with keys: date (YYYY-MM-DD or null), amount (number or null), currency (e.g., USD/INR or null), vendor (string or null), category (one-word category like groceries, food, transport, utilities, health, entertainment, dining, misc), items (array of objects with {name, qty, price, total}), raw_text (echo input), confidence (0.0-1.0). Strictly output JSON only with no surrounding explanation or commentary.`;
const examples = `Examples:\nOCR_TEXT:\nChicken 2kg 500\nRice 5kg 250\nTotal 750\n-> {"category":"food","amount":750}\n\nOCR_TEXT:\nTaxi Uber 12.50\nTotal 12.50\n-> {"category":"transport","amount":12.5}\n\nOCR_TEXT:\nParacetamol 2 50\nTotal 50\n-> {"category":"health","amount":50}\n`;
const user = `OCR_TEXT:\n${rawText}\n\n${examples}`;

(async () => {
  try {
    const resp = await axios.post(apiUrl, {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.0,
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const choice = resp.data && resp.data.choices && resp.data.choices[0];
    const text = (choice && choice.message && choice.message.content) || null;
    console.log('LLM raw output:\n', text);
    const jsonStart = text && text.indexOf('{');
    const jsonText = (jsonStart >= 0 && text) ? text.slice(jsonStart) : text;
    try {
      const parsed = JSON.parse(jsonText);
      console.log('Parsed JSON:', parsed);
    } catch (e) {
      console.error('Failed to parse JSON from LLM:', e.message);
    }
  } catch (err) {
    console.error('LLM request failed:', err && err.message ? err.message : err);
  }
})();
