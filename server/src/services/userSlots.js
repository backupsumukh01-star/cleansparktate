const sessionToUser = new Map();

export function assignUserId(sessionId) {
  const used = new Set(sessionToUser.values());
  let userId;
  if (!used.has('user1')) userId = 'user1';
  else if (!used.has('user2')) userId = 'user2';
  else return null;

  sessionToUser.set(sessionId, userId);
  return userId;
}

export function getUserId(sessionId) {
  return sessionToUser.get(sessionId);
}

export function releaseUserId(sessionId) {
  sessionToUser.delete(sessionId);
}

export function getActiveUserIds() {
  return [...new Set(sessionToUser.values())];
}
