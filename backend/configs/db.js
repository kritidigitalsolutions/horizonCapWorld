const mongoose = require("mongoose");
require("dotenv").config();

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  // If already connected (readyState 1), return cached connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(uri, opts).then(async (mongooseInstance) => {
      console.log("[MongoDB] Connected successfully to cluster.");
      // Auto-run initial seeder check (for Admin, Settings, Plans, Ranks)
      try {
        const seedInitialData = require("../utils/seeder");
        await seedInitialData();
      } catch (seedErr) {
        console.warn("[Seeder Notice]:", seedErr.message);
      }
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[MongoDB] Connection Error:", e.message);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;