// Global crypto compatibility polyfill for Node.js 18 with MongoDB Driver
const nodeCrypto = require("crypto");
if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
}
if (!global.crypto) {
  global.crypto = nodeCrypto;
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./configs/db");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const contactRoutes = require("./routes/contactRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Trust the reverse proxy (Nginx)
app.set("trust proxy", 1);

// ──────── PRODUCTION SECURITY HEADERS (HELMET) ────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Managed by Nginx / Frontend
  })
);

// ──────── PRODUCTION CORS CONFIGURATION ────────
const isProduction = process.env.NODE_ENV === "production";

const defaultProductionOrigins = [
  "https://horizoncapworld.com",
  "https://www.horizoncapworld.com",
  "https://admin.horizoncapworld.com",
  "https://investor.horizoncapworld.com",
  "https://app.horizoncapworld.com",
  "https://api.horizoncapworld.com",
];

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5000",
];

// Dynamically parse origins from env (CORS_ORIGIN, CORS_ORIGINS, or ALLOWED_ORIGINS)
const envOrigins = (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOriginsSet = new Set([
  ...defaultProductionOrigins,
  ...(!isProduction ? defaultDevOrigins : []),
  ...envOrigins,
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or curl/mobile requests without Origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    if (allowedOriginsSet.has(cleanOrigin)) {
      return callback(null, true);
    }

    if (!isProduction && (cleanOrigin.includes("localhost") || cleanOrigin.includes("127.0.0.1"))) {
      return callback(null, true);
    }

    // Disallow arbitrary origins
    return callback(new Error("CORS policy: This origin is not allowed access."));
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

// ──────── RATE LIMITING (BRUTE-FORCE & DOS PROTECTION) ────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});
app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests, please try again after 15 minutes." },
});
app.use("/api/admin/auth/login", authLimiter);
app.use("/api/user/auth/login", authLimiter);
app.use("/api/user/auth/register", authLimiter);
app.use("/api/contact", authLimiter);

// Body Parsing Middlewares with reasonable limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ──────── DATABASE CONNECTION ENSURANCE MIDDLEWARE ────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("[DB Middleware Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please contact administrator.",
    });
  }
});

// ──────── HEALTH CHECK ENDPOINTS (SECURE & SAFE) ────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Horizon Capital Backend API Engine Online",
  });
});

// ──────── ROUTE MOUNTING ────────
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/inquiries", contactRoutes);

// ──────── CENTRALIZED ERROR HANDLER ────────
app.use(errorHandler);

module.exports = app;
