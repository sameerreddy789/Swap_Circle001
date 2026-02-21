'use client';

import { useState, useEffect, useOptimistic } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function SaveItemButton({ itemId }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [optimisticIsSaved, setOptimisticIsSaved] = useOptimistic(
    isSaved,
    (currentState, optimisticValue) => optimisticValue
  );

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !firestore) {
        setIsLoading(false);
        return;
      }
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const saved = userData.savedItems?.includes(itemId) || false;
          setIsSaved(saved);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      checkIfSaved();
    }
  }, [user, isUserLoading, firestore, itemId]);

  const handleToggleSave = async (e) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You need to be logged in to save items.',
      });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const newOptimisticState = !isSaved;
    
    setOptimisticIsSaved(newOptimisticState);

    try {
      if (newOptimisticState) {
        await updateDoc(userRef, { savedItems: arrayUnion(itemId) });
        toast({ title: 'Item added to your wishlist!' });
      } else {
        await updateDoc(userRef, { savedItems: arrayRemove(itemId) });
        toast({ title: 'Item removed from your wishlist.' });
      }
      setIsSaved(newOptimisticState);
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your wishlist. Please try again.',
      });
      setOptimisticIsSaved(isSaved); 
    }
  };

  if (isUserLoading) {
    return (
        <Button size="icon" variant="ghost" className="rounded-full bg-black/20" disabled>
            <Bookmark className="h-5 w-5 text-transparent" />
        </Button>
    )
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleToggleSave}
      disabled={isLoading}
      className="rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white backdrop-blur-sm"
      aria-label={optimisticIsSaved ? 'Unsave item' : 'Save item'}
    >
      <Bookmark
          className={cn(
          'h-5 w-5 transition-all',
          optimisticIsSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
          )}
      />
    </Button>
  );
}
