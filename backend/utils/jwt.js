const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET environment variable is missing in production.");
    }
    console.warn("[SECURITY WARNING] JWT_SECRET not configured in .env.");
    return "dev_insecure_jwt_secret_replace_in_production";
  }
  return secret;
};

const generateToken = (id, role = "SUPER_ADMIN") => {
  return jwt.sign(
    { id, role },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
};

const verifyToken = (token) => {
  return jwt.verify(
    token,
    getJwtSecret()
  );
};

module.exports = { generateToken, verifyToken };
