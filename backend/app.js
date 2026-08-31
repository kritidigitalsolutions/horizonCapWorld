const express = require("express");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Horizon Capital Backend API Engine Online",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount File & Media Upload Route
app.use("/api/upload", uploadRoutes);

// Mount Super Admin API Routes
app.use("/api/admin", adminRoutes);

// Mount User & Investor API Routes
app.use("/api/user", userRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
