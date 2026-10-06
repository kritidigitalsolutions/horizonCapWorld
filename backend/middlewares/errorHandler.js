const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Sanitize any sensitive details (like database URIs) from logged error
  const sanitizedMsg = (err.message || "").replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");

  if (!isProduction) {
    console.error("[API Error]:", sanitizedMsg, err.stack);
  } else {
    console.error("[API Error]:", sanitizedMsg);
  }

  // Handle CORS errors specifically
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Access forbidden: Origin not permitted by CORS policy.",
    });
  }

  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || (err.name === "ValidationError" ? 400 : 500);

  const safeMessage =
    statusCode >= 500 && isProduction
      ? "Internal Server Error"
      : sanitizedMsg || "An unexpected error occurred";

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
