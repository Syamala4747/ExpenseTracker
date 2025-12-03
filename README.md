# ExpenseTracker

A full-stack personal expense tracker with manual expense entry and Cloudinary-backed profile photo uploads.

This repository contains two main parts:

- `backend/` — Node.js + Express API providing authentication, expense & income endpoints, upload support, and dashboard endpoints.
- `frontend/` — React + Vite single page app for managing expenses and user profile.


Contents
- Features
- Project structure
- Key API endpoints
- Environment variables
- Local setup (backend)
- Local setup (frontend)
- Testing & troubleshooting
- Deployment notes

Features
- Manual add / edit / delete expenses and incomes.
- Profile photo uploads stored on Cloudinary (`POST /api/v1/upload`).
- JWT-based authentication.
- Dashboard endpoints for aggregated data.

Project structure (important files)
- `backend/`
  - `server.js` — Express app entry (CORS handling, route mounting).
  - `routes/` — `authRoutes.js`, `expenseRoutes.js`, `incomeRoutes.js`, `dashboardRoutes.js`, `uploadRoutes.js`.
  - `controllers/` — controllers for auth, expense, income, dashboard. `parseController.js` has been removed/stubbed (no OCR).
  - `config/cloudinary.js` — Cloudinary client config (reads env vars).
  - `models/` — Mongoose schemas (`User.js`, `Expense.js`, `Income.js`).

- `frontend/`
  - `src/components/Inputs/ProfilePhotoSelector.jsx` — UI to pick profile picture.
  - `src/utils/uploadImage.js` — posts `multipart/form-data` with field `photo` to the backend upload route.
  - `src/utils/apiPaths.js` & `src/utils/axiosInstance.js` — API path constants and axios instance with baseURL.

Key API endpoints
- `POST /api/v1/auth/login` — login (returns JWT)
- `POST /api/v1/auth/signUp` — register user
- `GET /api/v1/auth/getUser` — get current user
- `POST /api/v1/expense/add` — add expense
- `GET /api/v1/expense/get` — list expenses
- `DELETE /api/v1/expense/:id` — delete expense
- `POST /api/v1/income/add` — add income
- `GET /api/v1/income/get` — list incomes
- `POST /api/v1/upload` — upload file (Cloudinary). Expects `multipart/form-data` field name `photo`. Returns `{ imageUrl: "https://..." }` on success.

Environment variables (create `backend/.env`, do NOT commit)
```
MONGO_URI=mongodb://<user>:<pass>@host:port/expense-tracker
JWT_SECRET=some_long_secret
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cloudinary (for profile photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# (Optional) Extra CORS origins
EXTRA_ALLOWED_ORIGINS=https://your-production-url.com,https://another-host.com
```

Local setup — Backend
1. Open PowerShell and install dependencies:
```powershell
cd C:\Users\syama\JAVA\Desktop\ExpenseTracker\ExpenseTracker\backend
npm install
```
2. Create `backend/.env` with the variables above.
3. Start development server:
```powershell
npm run dev
# or in production mode
npm start
```

Local setup — Frontend
1. In a separate terminal:
```powershell
cd C:\Users\syama\JAVA\Desktop\ExpenseTracker\ExpenseTracker\frontend
npm install
npm run dev
```
2. The Vite dev server runs on `http://localhost:5173` by default (or whatever port Vite chooses). Make sure `CLIENT_URL` in backend `.env` matches the frontend origin while developing.

Testing upload (curl)
```powershell
curl -X POST "http://localhost:3000/api/v1/upload" -F "photo=@C:\path\to\test.jpg"
```
Expect a JSON body with `imageUrl` on success.

Notes & troubleshooting
- OCR / LLM: The parse / OCR endpoints were intentionally removed. If you need automated OCR in the future, add a cloud OCR provider or deploy the backend with Tesseract installed in a Docker image.
- CORS: `server.js` includes permissive-but-logged CORS logic and a dev-only debug endpoint at `/api/v1/debug/allowed-origins` to help diagnose origin rejections.
- If frontend `npm run dev` exits with code 1, copy the terminal error here and I will help fix it — common problems are missing Vite env vars or dependency version mismatches.

Deployment notes
- Set environment variables (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_URL` or `EXTRA_ALLOWED_ORIGINS`) in your host (Render, Vercel, etc.).
- After pushing, redeploy the backend so CORS and route changes take effect.
- If you later decide to re-enable server-side OCR, prefer a Docker deployment that installs the system `tesseract` binary and tessdata.

Contributor notes
- Keep secrets out of the repo. Use host provider settings for env vars.
- Run backend and frontend locally to verify changes before deploying.

License
Provided as-is.
