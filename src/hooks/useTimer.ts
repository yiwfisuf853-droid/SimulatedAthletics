import { useState, useEffect, useCallback, useRef } from 'react';

export const useTimer = (isActive: boolean, onUpdate?: (elapsed: number) => void) => {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(elapsed);
  const onUpdateRef = useRef(onUpdate);

  // 同步最新的已用时间，避免闭包读取旧值。
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedRef.current * 1000;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const newElapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(newElapsed);
        onUpdateRef.current?.(newElapsed);
      }
    }, 100);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setElapsed(0);
    elapsedRef.current = 0;
    startTimeRef.current = null;
  }, [pause]);

  useEffect(() => {
    if (isActive) {
      start();
    } else {
      pause();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, start, pause]);

  return {
    elapsed,
    start,
    pause,
    reset,
  };
};
