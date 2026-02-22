'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;
    const direction = scrollY > lastScrollY.current ? 'down' : 'up';

    if (Math.abs(scrollY - lastScrollY.current) > 10) {
      setScrollDirection(prev => prev === direction ? prev : direction);
    }

    lastScrollY.current = scrollY > 0 ? scrollY : 0;
    ticking.current = false;
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateScrollDirection);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [updateScrollDirection]);

  return scrollDirection;
}
