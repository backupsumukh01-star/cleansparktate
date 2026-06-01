import { MAX_MESSAGES, MEDIA_TTL_MS } from '../../../shared/constants.js';

class MessageStore {
  constructor() {
    this.messages = [];
    this.seenUpTo = null;
  }

  add(message) {
    this.messages.push(message);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
    return message;
  }

  getAll() {
    return [...this.messages];
  }

  getById(id) {
    return this.messages.find((m) => m.id === id);
  }

  delete(id) {
    const index = this.messages.findIndex((m) => m.id === id);
    if (index === -1) return null;
    const [removed] = this.messages.splice(index, 1);
    return removed;
  }

  markSeen(messageId) {
    const msg = this.getById(messageId);
    if (msg) {
      msg.seen = true;
      msg.seenAt = Date.now();
    }
    this.seenUpTo = messageId;
    return this.messages.filter((m) => !m.seen).map((m) => m.id);
  }

  markAllSeen() {
    const now = Date.now();
    const unmarked = [];
    for (const msg of this.messages) {
      if (!msg.seen) {
        msg.seen = true;
        msg.seenAt = now;
        unmarked.push(msg.id);
      }
    }
    return unmarked;
  }
}

class MediaStore {
  constructor() {
    this.files = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  store(id, buffer, mimeType, filename) {
    const expiresAt = Date.now() + MEDIA_TTL_MS;
    this.files.set(id, { buffer, mimeType, filename, expiresAt, createdAt: Date.now() });
    return id;
  }

  get(id) {
    const file = this.files.get(id);
    if (!file) return null;
    if (Date.now() > file.expiresAt) {
      this.files.delete(id);
      return null;
    }
    return file;
  }

  delete(id) {
    return this.files.delete(id);
  }

  cleanup() {
    const now = Date.now();
    for (const [id, file] of this.files.entries()) {
      if (now > file.expiresAt) {
        this.files.delete(id);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.files.clear();
  }
}

class PresenceStore {
  constructor() {
    this.users = new Map();
  }

  setOnline(socketId, userId) {
    this.users.set(userId, {
      userId,
      socketId,
      online: true,
      lastActive: Date.now(),
      typing: false,
    });
  }

  setOffline(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.online = false;
      user.lastActive = Date.now();
      user.typing = false;
    }
  }

  setTyping(userId, typing) {
    const user = this.users.get(userId);
    if (user) {
      user.typing = typing;
      user.lastActive = Date.now();
    }
  }

  touch(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.lastActive = Date.now();
    }
  }

  getPresence() {
    const result = {};
    for (const [userId, data] of this.users.entries()) {
      result[userId] = {
        online: data.online,
        lastActive: data.lastActive,
        typing: data.typing,
      };
    }
    return result;
  }

  getOnlineCount() {
    let count = 0;
    for (const data of this.users.values()) {
      if (data.online) count++;
    }
    return count;
  }
}

class CallStore {
  constructor() {
    this.activeCall = null;
  }

  start(callerId, type) {
    if (this.activeCall) return false;
    this.activeCall = { callerId, type, startedAt: Date.now() };
    return true;
  }

  end() {
    this.activeCall = null;
  }

  isActive() {
    return this.activeCall !== null;
  }

  get() {
    return this.activeCall;
  }
}

export const messageStore = new MessageStore();
export const mediaStore = new MediaStore();
export const presenceStore = new PresenceStore();
export const callStore = new CallStore();
