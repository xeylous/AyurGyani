/**
 * Enterprise Session & Memory Persistence Store
 * Manages persistent user states, multi-turn chat history, and tool execution logs.
 */
class SessionStore {
  constructor() {
    this.sessions = new Map();
    // Auto cleanup inactive sessions older than 24 hours
    this.ttlMs = 24 * 60 * 60 * 1000;
    this.startCleanupTimer();
  }

  /**
   * Get or create user session
   * @param {string} userId 
   * @returns {Object} User session object
   */
  getSession(userId) {
    const id = userId || `guest_${Date.now()}`;
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        userId: id,
        name: null,
        step: "greet",
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

  /**
   * Update user session data
   * @param {string} userId 
   * @param {Object} updates 
   */
  updateSession(userId, updates) {
    const session = this.getSession(userId);
    Object.assign(session, updates, { lastActive: Date.now() });
    return session;
  }

  /**
   * Append a chat turn to the user history
   * @param {string} userId 
   * @param {string} role - 'user' | 'model' | 'function'
   * @param {string|Array} parts 
   */
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

  /**
   * Log a tool execution event
   * @param {string} userId 
   * @param {string} toolName 
   * @param {Object} args 
   * @param {Object} result 
   */
  logToolExecution(userId, toolName, args, result) {
    const session = this.getSession(userId);
    session.toolExecutions.push({
      toolName,
      args,
      resultSummary: typeof result === "object" ? JSON.stringify(result).substring(0, 200) : String(result),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clear session explicitly (e.g., when user says goodbye)
   * @param {string} userId 
   */
  deleteSession(userId) {
    if (userId) {
      return this.sessions.delete(userId);
    }
    return false;
  }

  /**
   * Get active sessions summary for health monitoring
   */
  getStats() {
    return {
      activeSessionsCount: this.sessions.size,
      oldestSession: this.getOldestSessionAge()
    };
  }

  getOldestSessionAge() {
    let oldest = Date.now();
    for (const s of this.sessions.values()) {
      if (s.lastActive < oldest) oldest = s.lastActive;
    }
    return oldest === Date.now() ? 0 : Math.round((Date.now() - oldest) / 1000);
  }

  startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions.entries()) {
        if (now - session.lastActive > this.ttlMs) {
          console.log(`🧹 Evicting inactive session: ${id}`);
          this.sessions.delete(id);
        }
      }
    }, 60 * 60 * 1000); // Check hourly
  }
}

export const sessionStore = new SessionStore();
