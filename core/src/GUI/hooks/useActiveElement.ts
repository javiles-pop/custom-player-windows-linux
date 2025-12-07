import { useEffect, useRef } from 'react';

export function useActiveElement() {
  const active = useRef<Element | null>(document.activeElement);

  const handleFocusIn = () => {
    active.current = document.activeElement;
  };

  useEffect(() => {
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  return active.current;
}
