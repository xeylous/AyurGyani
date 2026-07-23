import express from "express";
import { config } from "./src/config/env.js";
import { corsMiddleware } from "./src/config/cors.js";
import apiRoutes from "./src/routes/apiRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

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
});