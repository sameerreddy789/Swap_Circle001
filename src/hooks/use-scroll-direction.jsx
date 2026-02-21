'use client';

import { useState, useEffect } from 'react';

/**
 * A custom React hook that detects the vertical scroll direction ('up' or 'down').
 * @returns {'up' | 'down' | null} The current scroll direction.
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const scrollThreshold = 10; 

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';

      if (Math.abs(scrollY - lastScrollY) > scrollThreshold && direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener('scroll', updateScrollDirection);

    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, [scrollDirection]);

  return scrollDirection;
}
