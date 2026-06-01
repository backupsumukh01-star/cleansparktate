import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MAX_MESSAGES } from '../../../shared/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = process.env.CHAT_BACKUP_DIR || path.resolve(__dirname, '../../data');
const BACKUP_FILE = path.join(BACKUP_DIR, 'messages-backup.json');

let saveTimer = null;

function ensureDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function loadBackup() {
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data?.messages) ? data.messages : [];
    return list
      .filter((m) => m && m.id && m.createdAt)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-MAX_MESSAGES);
  } catch (err) {
    console.error('Chat backup load failed:', err.message);
    return [];
  }
}

function writeBackup(messages) {
  ensureDir();
  const trimmed = messages.slice(-MAX_MESSAGES);
  const payload = {
    savedAt: Date.now(),
    count: trimmed.length,
    messages: trimmed,
  };
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(payload), 'utf8');
}

export function saveBackup(messages) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      writeBackup(messages);
    } catch (err) {
      console.error('Chat backup save failed:', err.message);
    }
  }, 400);
}

export function saveBackupNow(messages) {
  clearTimeout(saveTimer);
  try {
    writeBackup(messages);
  } catch (err) {
    console.error('Chat backup save failed:', err.message);
  }
}

export function getBackupPath() {
  return BACKUP_FILE;
}
