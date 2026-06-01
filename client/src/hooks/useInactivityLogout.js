import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Auto logout after no chat messages (sent or received) for 3 minutes.
 * Timer pauses during active calls.
 */
export function useInactivityLogout({ logout, onActivity, pause = false }) {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    if (pause) return;
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_MS);
  }, [logout, pause]);

  const bumpActivity = useCallback(() => {
    onActivity?.();
    resetTimer();
  }, [onActivity, resetTimer]);

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetTimer]);

  useEffect(() => {
    if (pause) {
      clearTimeout(timerRef.current);
    } else {
      resetTimer();
    }
  }, [pause, resetTimer]);

  return { bumpActivity };
}
