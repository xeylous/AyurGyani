import express from "express";
import { handleChat, handlePing, handleHealth, handleGetSession } from "../controllers/chatController.js";
import { validateChatRequest } from "../middleware/validate.js";

const router = express.Router();

// System Health & Keep-alive routes
router.get("/ping", handlePing);
router.get("/health", handleHealth);

// Session inspection route
router.get("/session/:userId", handleGetSession);

// Core Agent Chat route
router.post("/chat", validateChatRequest, handleChat);

export default router;
