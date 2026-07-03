import { useEffect, useState } from 'react';

// 값이 delay(ms) 동안 바뀌지 않을 때만 반영되는 값. (검색어 → 서버 요청 폭주 방지)
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
