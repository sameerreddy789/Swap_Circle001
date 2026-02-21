'use client';

import {
  createContext,
  useState,
  useContext,
  useCallback,
} from 'react';

const LoadingContext = createContext(undefined);

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = useCallback((duration) => {
    setIsLoading(true);
    if (duration) {
      setTimeout(() => {
        setIsLoading(false);
      }, duration);
    }
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
