'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const reportReasons = [
    { value: 'spam', label: 'Spam or Misleading' },
    { value: 'harassment', label: 'Harassment or Hate Speech' },
    { value: 'fraud', label: 'Fraud or Scam' },
    { value: 'inappropriate-item', label: 'Inappropriate Item' },
    { value: 'other', label: 'Other' }
];

export default function ReportDialog({ isOpen, onOpenChange, trade, reporterId, reportedUser }) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleClose = () => {
    setReason('');
    setComment('');
    onOpenChange(false);
  }

  const handleSubmitReport = async () => {
    if (!reason) {
      toast({ variant: 'destructive', title: 'Please select a reason for the report.' });
      return;
    }
    if (!firestore) return;

    setIsSubmitting(true);
    
    const reportsCollection = collection(firestore, 'reports');
    
    const reportData = {
        reporterId: reporterId,
        reportedId: reportedUser.id,
        tradeId: trade.id,
        reason: reason,
        comment: comment,
        createdAt: serverTimestamp(),
        status: 'pending'
    };

    try {
        addDocumentNonBlocking(reportsCollection, reportData);
        toast({ title: 'Report Submitted', description: `Thank you for your feedback about ${reportedUser.username}.` });
        handleClose();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your report. Please try again.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {reportedUser.username}</DialogTitle>
          <DialogDescription>
            Your report is anonymous. If you believe someone is in immediate danger, please contact local authorities.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select onValueChange={(value) => setReason(value)}>
                <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                    {reportReasons.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
             <Label htmlFor="comment">Additional details (optional)</Label>
            <Textarea
                id="comment"
                placeholder="Please provide any additional information that could be helpful."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
            />
           </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmitReport} disabled={isSubmitting || !reason}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
