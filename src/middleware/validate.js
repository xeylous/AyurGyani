export function validateChatRequest(req, res, next) {
  const { message, userId } = req.body || {};

  if (!message && !userId) {
    return res.status(400).json({
      success: false,
      error: "Request body must contain at least a 'message' or 'userId'."
    });
  }

  next();
}
