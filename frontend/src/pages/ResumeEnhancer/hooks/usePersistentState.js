import { useState, useEffect, useRef } from 'react';

/**
 * useState that transparently mirrors its value to localStorage so the user's
 * work survives a page refresh. Falls back to in-memory state if storage is
 * unavailable (private mode, quota, serialization errors).
 *
 * @param {string} key       localStorage key (namespaced by the caller)
 * @param {*}      initial   initial value when nothing is persisted yet
 */
export default function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  // Avoid an unnecessary write on the very first render.
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep working from in-memory state */
    }
  }, [key, value]);

  return [value, setValue];
}
