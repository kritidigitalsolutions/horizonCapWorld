const jwt = require("jsonwebtoken");

const generateToken = (id, role = "SUPER_ADMIN") => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || "horizon_super_admin_secret_key_2026_jwt_token",
    { expiresIn: "30d" }
  );
};

const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || "horizon_super_admin_secret_key_2026_jwt_token"
  );
};

module.exports = { generateToken, verifyToken };
