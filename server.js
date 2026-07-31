import express from "express";
import { config } from "./src/config/env.js";
import { corsMiddleware } from "./src/config/cors.js";
import apiRoutes from "./src/routes/apiRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

// ─── Explicit Preflight Handler (fires BEFORE everything else) ───
// Guarantees CORS headers even during Render cold-starts or gateway timeouts
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Apply CORS & Body Parser Middlewares
app.use(corsMiddleware);
app.use(express.json());

// Register API Routes
app.use("/", apiRoutes);

// Register Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(config.port, () => {
  console.log(`🚀 AyurGyani Enterprise Agent Engine running on port ${config.port}`);
  console.log(`🌿 Model: Google Gemini 2.5 Flash with Dynamic Tool Calling Enabled`);

  // Self-ping to prevent Render free tier from sleeping (every 5 minutes)
  const SELF_PING_URL = `https://ayurgyani-api.onrender.com/ping`;
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const selfPing = () => {
    fetch(SELF_PING_URL)
      .then(() => console.log(`🏓 Self-ping successful`))
      .catch(() => console.log(`⚠️ Self-ping failed`));
  };

  // Ping immediately on startup, then repeat every 5 minutes
  selfPing();
  setInterval(selfPing, PING_INTERVAL);
});