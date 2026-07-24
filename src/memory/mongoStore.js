import mongoose from "mongoose";
import { config } from "../config/env.js";

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: null },
  step: { type: String, default: "greet" },
  doshaProfile: { type: Object, default: null },
  history: [
    {
      role: { type: String, required: true },
      parts: { type: mongoose.Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  toolExecutions: [
    {
      toolName: String,
      args: Object,
      resultSummary: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

const SessionModel = mongoose.models.Session || mongoose.model("Session", sessionSchema);

let isConnected = false;

export async function initMongoConnection() {
  if (isConnected) return true;
  if (!config.mongoUri) return false;

  try {
    console.log("🍃 Connecting to MongoDB Atlas...");
    await mongoose.connect(config.mongoUri);
    isConnected = true;
    console.log("✅ Connected to MongoDB Atlas successfully!");
    return true;
  } catch (err) {
    console.warn("⚠️ MongoDB Connection Warning (falling back to memory store):", err.message);
    return false;
  }
}

export class MongoSessionStore {
  async getSession(userId) {
    const id = userId || `guest_${Date.now()}`;
    await initMongoConnection();

    if (!isConnected) return null;

    let doc = await SessionModel.findOne({ userId: id });
    if (!doc) {
      doc = await SessionModel.create({
        userId: id,
        name: null,
        step: "greet",
        history: [],
        toolExecutions: [],
        lastActive: new Date()
      });
    } else {
      doc.lastActive = new Date();
      await doc.save();
    }

    return doc.toObject();
  }

  async updateSession(userId, updates) {
    await initMongoConnection();
    if (!isConnected) return null;

    const doc = await SessionModel.findOneAndUpdate(
      { userId },
      { $set: { ...updates, lastActive: new Date() } },
      { returnDocument: "after", upsert: true }
    );
    return doc ? doc.toObject() : null;
  }

  async addHistoryTurn(userId, role, parts) {
    await initMongoConnection();
    if (!isConnected) return null;

    const content = typeof parts === "string" ? [{ text: parts }] : parts;
    const turn = {
      role: role === "model" || role === "assistant" ? "model" : "user",
      parts: content,
      timestamp: new Date()
    };

    const doc = await SessionModel.findOneAndUpdate(
      { userId },
      { 
        $push: { history: turn },
        $set: { lastActive: new Date() }
      },
      { returnDocument: "after" }
    );
    return doc ? doc.toObject() : null;
  }

  async logToolExecution(userId, toolName, args, result) {
    await initMongoConnection();
    if (!isConnected) return null;

    const logEntry = {
      toolName,
      args,
      resultSummary: typeof result === "object" ? JSON.stringify(result).substring(0, 200) : String(result),
      timestamp: new Date()
    };

    await SessionModel.updateOne(
      { userId },
      { 
        $push: { toolExecutions: logEntry },
        $set: { lastActive: new Date() }
      }
    );
  }

  /**
   * Delete session document from MongoDB collection once chat is ended
   */
  async deleteSession(userId) {
    await initMongoConnection();
    if (!isConnected) return false;

    console.log(`🧹 Deleting MongoDB session document for ended chat: ${userId}`);
    const res = await SessionModel.deleteOne({ userId });
    return res.deletedCount > 0;
  }
}

export const mongoSessionStore = new MongoSessionStore();
