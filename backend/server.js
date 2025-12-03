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
// Support comma-separated CLIENT_URL in .env, but allow additional overrides via EXTRA_ALLOWED_ORIGINS
const clientUrlEnv = process.env.CLIENT_URL || '';
const extraAllowedEnv = process.env.EXTRA_ALLOWED_ORIGINS || '';
// sensible default extra - include the known Vercel frontend used for testing/deployments
const DEFAULT_EXTRA_ALLOWED = ['https://expense-tracker-delta-seven-83.vercel.app'];
const allowedOriginsFromClient = clientUrlEnv.split(',').map(s => s.trim()).filter(Boolean);
const allowedOriginsFromExtra = extraAllowedEnv.split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = Array.from(new Set([
  ...allowedOriginsFromClient,
  ...allowedOriginsFromExtra,
  ...DEFAULT_EXTRA_ALLOWED
]));
console.log('Configured CORS allowedOrigins:', allowedOrigins);

// Use the `cors` middleware for basic handling but also add a fallback
app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check - incoming origin:', origin, 'allowedOrigins:', allowedOrigins);
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: origin explicitly allowed:', origin);
      return callback(null, true);
    }
    // Allow common hosting provider domains when a specific origin wasn't configured
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
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));

// Additional robust CORS handling: explicitly set CORS headers for OPTIONS and regular requests
const allowedSuffixes = ['.vercel.app', '.onrender.com', '.netlify.app', '.github.io', '.now.sh'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // no origin -> skip
  if (!origin) return next();

  const lower = (origin || '').toLowerCase();
  const originAllowed = (
    allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin) ||
    allowedSuffixes.some(s => lower.endsWith(s))
  );

  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
  }
  next();
});

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

// Dev-only debug endpoint: shows what origins the server considers allowed
if ((process.env.NODE_ENV || 'development') !== 'production') {
  app.get('/api/v1/debug/allowed-origins', (req, res) => {
    return res.json({
      allowedOrigins,
      clientUrlEnv,
      incomingOrigin: req.headers.origin || null,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  });
}

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
