export function errorHandler(err, req, res, next) {
  console.error("❌ App Error:", err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}
