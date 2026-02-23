'use client';

import { useState, useCallback, useTransition } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function SaveItemButton({ itemId }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();

  // Use the real-time user profile subscription instead of individual getDoc calls
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const isSaved = userProfile?.savedItems?.includes(itemId) || false;

  const handleToggleSave = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Please log in', description: 'You need to be logged in to save items.' });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);

    startTransition(async () => {
      try {
        if (isSaved) {
          await updateDoc(userRef, { savedItems: arrayRemove(itemId) });
          toast({ title: 'Item removed from your wishlist.' });
        } else {
          await updateDoc(userRef, { savedItems: arrayUnion(itemId) });
          toast({ title: 'Item added to your wishlist!' });
        }
      } catch (error) {
        console.error('Error updating wishlist:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your wishlist.' });
      }
    });
  }, [user, firestore, itemId, isSaved]);

  if (isUserLoading || profileLoading) {
    return (
      <Button size="icon" variant="ghost" className="rounded-full bg-black/20" disabled>
        <Bookmark className="h-5 w-5 text-transparent" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleToggleSave}
      disabled={isPending}
      className="rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white backdrop-blur-sm"
      aria-label={isSaved ? 'Unsave item' : 'Save item'}
    >
      <Bookmark
        className={cn(
          'h-5 w-5 transition-all',
          isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
        )}
      />
    </Button>
  );
}
