# ExpenseTracker

A simple personal expense tracker with receipt OCR and LLM-assisted parsing.

This repository contains a full-stack app:

- backend/: Node.js + Express API, OCR parsing endpoint, MongoDB integration
- frontend/: React + Vite single-page app for managing expenses

## Features

- Upload receipts (images) and parse them using Tesseract OCR (native binary preferred)
- LLM enrichment to extract structured fields (date, amount, vendor, category)
- Fallback: OCR.space cloud API (optional via API key)
- Add/edit/delete expenses

## Prerequisites

- Node.js (16+ recommended)
- npm
- MongoDB (local or cloud)
- On the backend machine: Tesseract OCR installed for best local OCR reliability
  - Windows: `winget install --id tesseract-ocr.tesseract -e`
  - macOS: `brew install tesseract`
  - Linux: install package via distro package manager

## Installation (Backend)

1. Open a terminal and navigate to the backend folder:

```powershell
cd C:\Users\syama\JAVA\Desktop\ExpenseTracker\ExpenseTracker\backend
npm install
```

2. Create or edit `.env` with required keys (see section below).

3. Start the backend (development):

```powershell
# free port 3000 if needed
npx kill-port 3000
npm run dev
```

or start directly:

```powershell
node server.js
```

## Installation (Frontend)

1. Open a terminal and navigate to frontend folder:

```powershell
cd C:\Users\syama\JAVA\Desktop\ExpenseTracker\ExpenseTracker\frontend
npm install
npm run dev
```

2. The frontend runs by default on Vite (e.g. `http://localhost:5173`).

## Environment Variables (.env)

Place these in `backend/.env` (example):

```
MONGO_URI=mongodb://localhost:27017/expense-tracker
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
PORT=3000

# Cloudinary (optional - used for uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# LLM (optional) - used to enrich OCR output


NODE_ENV=development
```

Notes:
- If you don't have `LLM_API_KEY`, LLM enrichment is skipped and the server will use heuristics for category/amount/date.
- If you don't have `OCR_SPACE_API_KEY` and Tesseract fails, the server will return 503 with a debug field (development only).



## Tesseract troubleshooting

If you see "Error during processing." or the backend returns: "OCR engine unavailable...", follow these steps:

1. Verify Tesseract binary is installed and accessible:

PowerShell (Windows):

```powershell
"C:\Program Files\Tesseract-OCR\tesseract.exe" --version
"C:\Program Files\Tesseract-OCR\tesseract.exe" --list-langs
```

2. Ensure `eng` is present in the `tessdata` folder (e.g. `C:\Program Files\Tesseract-OCR\tessdata\eng.traineddata`). If missing, reinstall the Tesseract installer or download `eng.traineddata` to that folder.

3. If the server still fails but manual `tesseract` commands work, start the server from the same shell after setting `TESSDATA_PREFIX`:

```powershell
$env:TESSDATA_PREFIX='C:\Program Files\Tesseract-OCR\tessdata'
npm run dev
```

4. For modern image formats (AVIF/HEIF) the backend converts images to PNG using `sharp` or `jimp`. Make sure `npm install` completed successfully (backend `node_modules` includes `sharp` and `jimp`).

## Using OCR.space as a fallback

To enable cloud fallback set `OCR_SPACE_API_KEY` in `backend/.env`. Note that OCR.space has rate limits and may require an account.

## Testing the parse endpoint (curl)

Replace the file path with a local image path:

```bash
curl -v -X POST http://localhost:3000/api/v1/parse/receipt \
  -F "receipt=@C:/path/to/receipt.jpg"
```

Expected JSON: structured fields including `amount`, `date`, `category`, `vendor`, `raw_text`.

If you get a 503 in development, the JSON may include a `debug` object with Tesseract stderr to help identify the cause.

## Notes on LLM parsing

- The backend uses a short timeout for LLM enrichment. If the LLM is slow or the API key is absent/invalid, the response will contain heuristic results.
- To improve categorization, set `LLM_API_KEY` and consider increasing the LLM timeout in `backend/controllers/parseController.js` if needed.

## Contributing

- Fixes and PRs welcome. Keep changes scoped and run the app locally.

## License

This project is provided as-is.

---

If you want, I can also:
- Add a short README in `frontend/` and `backend/` subfolders with focused commands, or
- Add a developer troubleshooting script to check `tesseract --list-langs` and `node` environment from the server shell.

Tell me which you'd prefer and I will add it.