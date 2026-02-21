'use client';

import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * React hook to subscribe to a Firestore collection query in real-time.
 * @param {import('firebase/firestore').Query | null | undefined} memoizedQuery
 * @returns {{ data: Array | null, isLoading: boolean, error: Error | null }}
 */
export function useCollection(memoizedQuery) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memoizedQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    if (memoizedQuery && !memoizedQuery.__memo) {
        console.warn('Firestore query was not memoized. Use useMemoFirebase() to prevent infinite loops.');
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(results);
        setIsLoading(false);
      },
      (err) => {
        const path = memoizedQuery._query?.path?.canonicalString() || 'unknown path';
        
        const contextualError = new FirestorePermissionError({
            path: path,
            operation: 'list'
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedQuery]);

  return { data, isLoading, error };
}
