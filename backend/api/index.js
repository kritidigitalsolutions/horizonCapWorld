const app = require("../app");
const connectDB = require("../configs/db");

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("[Vercel Handler] MongoDB Connection Failure:", error.message);
  }
  return app(req, res);
};
