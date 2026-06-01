const CACHE_KEY = 'private-chat-messages-v1';
const MAX_CACHED = 1000;

export function loadCachedMessages() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data?.messages;
    if (!Array.isArray(list)) return [];
    return list
      .filter((m) => m?.id)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .slice(-MAX_CACHED);
  } catch {
    return [];
  }
}

export function saveCachedMessages(messages) {
  try {
    const trimmed = messages.slice(-MAX_CACHED);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(messages.slice(-200)));
    } catch {
      // storage full — ignore
    }
  }
}

export function mergeMessages(cached, server) {
  const map = new Map();
  for (const m of cached) {
    map.set(m.id, m);
  }
  for (const m of server) {
    map.set(m.id, m);
  }
  return [...map.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-MAX_CACHED);
}
