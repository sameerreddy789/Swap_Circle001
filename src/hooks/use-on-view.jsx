'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useOnView(callback, options = {}) {
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const targetRef = useRef(null);

  const setRef = useCallback((node) => {
    if (node) {
      targetRef.current = node;
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasBeenViewed) {
          if (targetRef.current) {
            callback(targetRef.current);
            setHasBeenViewed(true);
            obs.unobserve(targetRef.current);
          }
        }
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.1,
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [hasBeenViewed, callback, options]);

  return setRef;
}
