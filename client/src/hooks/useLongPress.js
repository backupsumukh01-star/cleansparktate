import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, { delay = 500 } = {}) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e) => {
      movedRef.current = false;
      clear();
      timerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          onLongPress(e);
        }
      }, delay);
    },
    [onLongPress, delay, clear]
  );

  const move = useCallback(() => {
    movedRef.current = true;
    clear();
  }, [clear]);

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
      onLongPress(e);
    },
  };
}
