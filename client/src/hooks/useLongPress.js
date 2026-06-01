import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, { delay = 450 } = {}) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e) => {
      movedRef.current = false;
      const touch = e.touches?.[0];
      startPosRef.current = {
        x: touch?.clientX ?? e.clientX,
        y: touch?.clientY ?? e.clientY,
      };
      clear();
      timerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          if (navigator.vibrate) navigator.vibrate(12);
          onLongPress(e);
        }
      }, delay);
    },
    [onLongPress, delay, clear]
  );

  const move = useCallback(
    (e) => {
      const touch = e.touches?.[0];
      const x = touch?.clientX ?? e.clientX;
      const y = touch?.clientY ?? e.clientY;
      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);
      if (dx > 12 || dy > 12) {
        movedRef.current = true;
        clear();
      }
    },
    [clear]
  );

  const end = useCallback(() => {
    clear();
  }, [clear]);

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: move,
    onTouchCancel: end,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: end,
    onContextMenu: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(12);
      onLongPress(e);
    },
  };
}
