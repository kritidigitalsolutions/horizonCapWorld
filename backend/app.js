const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./configs/db");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ──────── DYNAMIC CORS ORIGIN CONFIGURATION ────────
const defaultAllowedOrigins = [
  "https://horizon-cap-world-edlz.vercel.app",
  "https://horizon-cap-world-6j9c.vercel.app",
  "https://horizon-cap-world.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://localhost:5002",
];

// Dynamically parse origins from env (e.g. CORS_ORIGIN or ALLOWED_ORIGINS)
const envOrigins = (process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin (no origin header, e.g. mobile, curl, Postman)
    if (!origin) return callback(null, true);

    if (
      allowedOriginsSet.has(origin) ||
      origin.endsWith(".vercel.app") || // Automatically allow all Vercel deployment URLs & preview branches
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }

    // Permissive fallback
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Body Parsing Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ──────── DATABASE CONNECTION ENSURANCE MIDDLEWARE ────────
// Essential for Vercel Serverless / Lambda to ensure MongoDB connection is ready before processing routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("[DB Middleware Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please verify MONGO_URI in your environment settings.",
      error: error.message,
    });
  }
});

// ──────── HEALTH CHECK & ROOT ROUTE ────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Horizon Capital Backend API Engine Online",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    allowedOrigins: Array.from(allowedOriginsSet),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ──────── ROUTE MOUNTING ────────
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// ──────── CENTRALIZED ERROR HANDLER ────────
app.use(errorHandler);

module.exports = app;
