'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function ReviewDialog({ isOpen, onOpenChange, trade, currentUser, otherUser }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        setRating(0);
        setComment('');
        setHoverRating(0);
    }, 300);
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({ variant: 'destructive', title: 'Please select a rating' });
      return;
    }
    if (!firestore) return;

    setIsSubmitting(true);
    toast({ title: "Submitting your review..." });

    try {
      const reviewsCollectionRef = collection(firestore, 'users', otherUser.id, 'reviews');
      const newReview = {
        fromUserId: currentUser.uid,
        fromUsername: currentUser.displayName,
        toUserId: otherUser.id,
        tradeId: trade.id,
        rating,
        comment,
        createdAt: serverTimestamp(),
      };
      
      addDocumentNonBlocking(reviewsCollectionRef, newReview);

      const tradeRef = doc(firestore, 'trades', trade.id);
      const isProposer = trade.proposerId === currentUser.uid;
      await updateDoc(tradeRef, {
        [isProposer ? 'reviewedByProposer' : 'reviewedByReceiver']: true,
      });

      toast({ title: 'Review submitted! 🎉', description: `Thanks for your feedback on ${otherUser.username}.` });
      handleClose();

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your review. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Leave a Review for {otherUser.username}</DialogTitle>
          <DialogDescription>How was your swapping experience?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <Star
                  key={starValue}
                  className={cn(
                    'h-8 w-8 cursor-pointer transition-colors',
                    starValue <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  )}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starValue)}
                />
              );
            })}
          </div>
          <Textarea
            placeholder="Share more about your experience... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" onClick={handleClose}>Skip for Now</Button>
            </DialogClose>
          <Button onClick={handleSubmitReview} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
