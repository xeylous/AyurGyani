import { mongoSessionStore, initMongoConnection } from "./mongoStore.js";
import { config } from "../config/env.js";

/**
 * Enterprise In-Memory Session Store (Fallback)
 */
class MemorySessionStore {
  constructor() {
    this.sessions = new Map();
    this.ttlMs = 24 * 60 * 60 * 1000;
  }

  getSession(userId) {
    const id = userId || `guest_${Date.now()}`;
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        userId: id,
        name: null,
        step: "conversation",
        doshaProfile: null,
        history: [],
        toolExecutions: [],
        createdAt: new Date().toISOString(),
        lastActive: Date.now()
      });
    }
    const session = this.sessions.get(id);
    session.lastActive = Date.now();
    return session;
  }

  updateSession(userId, updates) {
    const session = this.getSession(userId);
    Object.assign(session, updates, { lastActive: Date.now() });
    return session;
  }

  addHistoryTurn(userId, role, parts) {
    const session = this.getSession(userId);
    const content = typeof parts === "string" ? [{ text: parts }] : parts;
    session.history.push({
      role: role === "model" || role === "assistant" ? "model" : "user",
      parts: content,
      timestamp: new Date().toISOString()
    });
    session.lastActive = Date.now();
    return session;
  }

  logToolExecution(userId, toolName, args, result) {
    const session = this.getSession(userId);
    session.toolExecutions.push({
      toolName,
      args,
      resultSummary: typeof result === "object" ? JSON.stringify(result).substring(0, 200) : String(result),
      timestamp: new Date().toISOString()
    });
  }

  deleteSession(userId) {
    if (userId) {
      console.log(`🧹 Clearing in-memory session: ${userId}`);
      return this.sessions.delete(userId);
    }
    return false;
  }

  getStats() {
    return {
      activeSessionsCount: this.sessions.size,
      oldestSession: 0
    };
  }
}

const memoryStore = new MemorySessionStore();

/**
 * Unified Session Manager Bridge (MongoDB + Memory Fallback)
 */
class UnifiedSessionStore {
  async getSession(userId) {
    if (config.mongoUri) {
      const doc = await mongoSessionStore.getSession(userId);
      if (doc) return doc;
    }
    return memoryStore.getSession(userId);
  }

  async updateSession(userId, updates) {
    if (config.mongoUri) {
      const doc = await mongoSessionStore.updateSession(userId, updates);
      if (doc) return doc;
    }
    return memoryStore.updateSession(userId, updates);
  }

  async addHistoryTurn(userId, role, parts) {
    if (config.mongoUri) {
      const doc = await mongoSessionStore.addHistoryTurn(userId, role, parts);
      if (doc) return doc;
    }
    return memoryStore.addHistoryTurn(userId, role, parts);
  }

  async logToolExecution(userId, toolName, args, result) {
    if (config.mongoUri) {
      await mongoSessionStore.logToolExecution(userId, toolName, args, result);
    }
    memoryStore.logToolExecution(userId, toolName, args, result);
  }

  async deleteSession(userId) {
    let mongoDeleted = false;
    if (config.mongoUri) {
      mongoDeleted = await mongoSessionStore.deleteSession(userId);
    }
    const memDeleted = memoryStore.deleteSession(userId);
    return mongoDeleted || memDeleted;
  }

  getStats() {
    return memoryStore.getStats();
  }
}

export const sessionStore = new UnifiedSessionStore();
