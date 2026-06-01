const sessionToUser = new Map();
const disconnectTimers = new Map();

/**
 * Always returns a userId — never blocks login.
 * Prefers user not currently online; reuses same session mapping on relogin.
 */
export function assignUserId(sessionId, onlineUserIds = []) {
  if (sessionToUser.has(sessionId)) {
    return sessionToUser.get(sessionId);
  }

  cancelRelease(sessionId);

  let userId = 'user1';
  const u1Online = onlineUserIds.includes('user1');
  const u2Online = onlineUserIds.includes('user2');

  if (u1Online && !u2Online) {
    userId = 'user2';
  } else if (!u1Online && u2Online) {
    userId = 'user1';
  } else if (u1Online && u2Online) {
    // Both sockets active — still allow login; reclaim stale session entries
    userId = reclaimLeastRecentSlot();
  }

  sessionToUser.set(sessionId, userId);
  return userId;
}

function reclaimLeastRecentSlot() {
  const u1Sessions = [...sessionToUser.entries()].filter(([, u]) => u === 'user1');
  const u2Sessions = [...sessionToUser.entries()].filter(([, u]) => u === 'user2');
  const userId = u1Sessions.length <= u2Sessions.length ? 'user1' : 'user2';
  for (const [sid] of sessionToUser.entries()) {
    if (sessionToUser.get(sid) === userId) {
      sessionToUser.delete(sid);
    }
  }
  return userId;
}

export function getUserId(sessionId) {
  return sessionToUser.get(sessionId);
}

export function releaseUserId(sessionId) {
  cancelRelease(sessionId);
  sessionToUser.delete(sessionId);
}

/** Delay release so page refresh does not instantly free then lose identity */
export function scheduleRelease(sessionId, delayMs = 4000) {
  cancelRelease(sessionId);
  disconnectTimers.set(
    sessionId,
    setTimeout(() => {
      sessionToUser.delete(sessionId);
      disconnectTimers.delete(sessionId);
    }, delayMs)
  );
}

export function cancelRelease(sessionId) {
  const timer = disconnectTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(sessionId);
  }
}

export function getActiveUserIds() {
  return [...new Set(sessionToUser.values())];
}

export function getOnlineUserIdsFromPresence(presence) {
  return Object.entries(presence || {})
    .filter(([, p]) => p?.online)
    .map(([id]) => id);
}
