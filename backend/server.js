require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes"); // ✅ NEW: Add Cloudinary upload route
const parseRoutes = require("./routes/parseRoutes"); // OCR parse route

const app = express();

// ✅ Middleware for CORS
// Support comma-separated CLIENT_URL in .env, but only echo a single origin per response
const clientUrlEnv = process.env.CLIENT_URL || '';
const allowedOrigins = clientUrlEnv.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // DEBUG: log incoming origin and configured allowed origins
    console.log('CORS check - incoming origin:', origin, 'allowedOrigins:', allowedOrigins);
    // Allow requests from tools (curl/postman) where origin is undefined
    if (!origin) return callback(null, true);
    // If no allowed origins configured, allow all
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: origin explicitly allowed:', origin);
      return callback(null, true);
    }
    // Allow common hosting provider domains when a specific origin wasn't configured
    // This helps when the frontend is deployed on Vercel/Render/Netlify and the env var
    // wasn't updated to include the deployed origin yet.
    try {
      const lower = (origin || '').toLowerCase();
      const allowedSuffixes = ['.vercel.app', '.onrender.com', '.netlify.app', '.github.io', '.now.sh'];
      const suffixMatch = allowedSuffixes.some(s => lower.endsWith(s));
      if (suffixMatch) {
        console.log('CORS: origin allowed by hosting suffix match:', origin);
        return callback(null, true);
      }
    } catch (e) {
      // ignore and fall through to deny
    }
    console.warn('CORS: origin not allowed:', origin);
    // Deny access: do not set Access-Control-Allow-Origin header
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));

// Note: do not set Access-Control-Allow-Origin to multiple comma-separated values.
// The `cors` middleware above will echo back a single allowed origin when appropriate.

app.use(express.json());

// ✅ Connect to MongoDB
connectDB();

// ✅ API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/upload", uploadRoutes); // ✅ NEW: Cloudinary photo upload route
app.use("/api/v1/parse", parseRoutes); // OCR parse endpoint

// ❌ REMOVE local uploads serving (since we use Cloudinary now)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use port 3000 by default to match frontend dev proxy (Vite)
const PORT = process.env.PORT || 3000;

// Global error handlers to avoid sudden process exit and log details
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Generic Express error handler (must be after routes)
app.use((err, req, res, next) => {
  console.error('Express error handler:', err && err.stack ? err.stack : err);
  if (err && err.message && err.message.toLowerCase().includes('cors')) {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
  }
  res.status(500).json({ message: err?.message || 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
});
