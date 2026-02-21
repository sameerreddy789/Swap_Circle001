'use client';

import { useState } from 'react';
import { updateDocumentNonBlocking } from '@/firebase';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BlockDialog({ isOpen, onOpenChange, currentUserProfileRef, userToBlock, isBlocked }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleToggleBlock = async () => {
    if (!currentUserProfileRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find your user profile.' });
        return;
    }
    
    setIsSubmitting(true);
    
    const updateData = {
        blockedUsers: isBlocked ? arrayRemove(userToBlock.id) : arrayUnion(userToBlock.id)
    };

    try {
        await updateDocumentNonBlocking(currentUserProfileRef, updateData);
        toast({ 
            title: isBlocked ? 'User Unblocked' : 'User Blocked', 
            description: isBlocked 
                ? `You can now receive messages from ${userToBlock.username}.`
                : `${userToBlock.username} can no longer send you messages.`
        });
        onOpenChange(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update your block list. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const title = isBlocked ? `Unblock ${userToBlock.username}?` : `Block ${userToBlock.username}?`;
  const description = isBlocked
    ? "They will be able to send you messages and trade requests again."
    : "They won't be able to send you messages or new trade requests. You can unblock them at any time from their profile.";
  const buttonText = isBlocked ? "Yes, Unblock" : "Yes, Block";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant={isBlocked ? "secondary" : "destructive"} 
            onClick={handleToggleBlock} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (isBlocked ? 'Unblocking...' : 'Blocking...') : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
