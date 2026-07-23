import { processAgentMessage } from "../core/agent.js";
import { sessionStore } from "../memory/sessionStore.js";

/**
 * Handle POST /chat requests
 */
export async function handleChat(req, res, next) {
  try {
    const userMessage = req.body.message || "";
    const userId = req.body.userId || "guest_" + Date.now();

    const result = await processAgentMessage(userId, userMessage);

    res.json({
      reply: result.reply,
      step: result.step,
      toolsExecuted: result.toolsExecuted,
      modelUsed: result.modelUsed,
      userId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle GET /ping endpoint
 */
export function handlePing(req, res) {
  console.log(`🔄 Ping received at: ${new Date().toISOString()}`);
  res.status(200).send("💚 AyurSathi Enterprise Groq Agent Engine is active");
}

/**
 * Handle GET /health endpoint
 */
export function handleHealth(req, res) {
  const stats = sessionStore.getStats();
  res.status(200).json({
    status: "healthy",
    engine: "AyurGyani Groq Enterprise Agent Engine v2.5",
    uptime: process.uptime(),
    activeSessions: stats.activeSessionsCount,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle GET /session/:userId endpoint (for inspecting session history & tools)
 */
export function handleGetSession(req, res) {
  const { userId } = req.params;
  const session = sessionStore.getSession(userId);
  res.json({
    success: true,
    session
  });
}
