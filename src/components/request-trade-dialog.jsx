'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, FirestorePermissionError, errorEmitter } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Textarea } from "./ui/textarea";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function RequestTradeDialog({ isOpen, onOpenChange, receiverItem, receiver }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userItemsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, "items"), where("ownerId", "==", user.uid), where("status", "==", "available"));
  }, [firestore, user]);

  const { data: allUserItems, isLoading } = useCollection(userItemsQuery);

  const receiverTradePreference = receiverItem.tradePreference || 'permanent';

  const compatibleUserItems = useMemo(() => {
    if (!allUserItems) return [];
    return allUserItems.filter(item => (item.tradePreference || 'permanent') === receiverTradePreference);
  }, [allUserItems, receiverTradePreference]);

  const handleProposeTrade = async () => {
    if (!firestore || !user || !selectedItemId) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in and select an item to propose a trade." });
        return;
    }

    setIsSubmitting(true);
    toast({ title: "Sending Trade Request...", description: "Please wait a moment." });

    const proposerItem = allUserItems?.find(item => item.id === selectedItemId);
    if (!proposerItem) {
        toast({ variant: "destructive", title: "Error", description: "Selected item not found."});
        setIsSubmitting(false);
        return;
    }

    const tradesCollection = collection(firestore, 'trades');
    const tradeData = {
        proposerId: user.uid,
        proposerUsername: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        proposerItemId: selectedItemId,
        proposerItemName: proposerItem.name,
        proposerItemImageUrl: proposerItem.imageUrl,
        receiverId: receiver.id,
        receiverUsername: receiver.username,
        receiverItemId: receiverItem.id,
        receiverItemName: receiverItem.name,
        receiverItemImageUrl: receiverItem.imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [user.uid, receiver.id],
        reviewedByProposer: false,
        reviewedByReceiver: false,
        tradeType: receiverItem.tradePreference,
        ...(receiverItem.tradePreference === 'temporary' && { durationDays: receiverItem.loanDurationDays })
    };

    addDoc(tradesCollection, tradeData)
      .then(() => {
        toast({ title: "✅ Trade Request Sent", description: `We have notified ${receiver.username}.` });
        onOpenChange(false);
        router.push("/inbox");
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: tradesCollection.path,
          operation: 'create',
          requestResourceData: tradeData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Error Proposing Trade", description: "Could not propose the trade. Please check the developer console for details." });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Trade with {receiver.username}</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
                Propose a trade for {receiverItem.name}. Select one of your items to offer in exchange.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        
        <div className="space-y-4">
            <div>
                <Label>You are requesting:</Label>
                 <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">{receiverItem.name}</span> (a {receiverTradePreference} swap)
                </p>
                 {receiverTradePreference === 'temporary' && <p className="text-xs text-muted-foreground">Proposed duration: {receiverItem.loanDurationDays} days.</p>}
            </div>
            <div>
                <Label>Select an item to offer:</Label>
                <p className="text-sm text-muted-foreground mt-1">
                    Only your items listed for a <span className="font-semibold">{receiverTradePreference}</span> swap are shown.
                </p>
                <div className="max-h-[30vh] overflow-y-auto p-1 -mx-1 mt-2">
                {isLoading && <p>Loading your items...</p>}
                {!isLoading && compatibleUserItems && compatibleUserItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {compatibleUserItems.map(item => (
                            <Card 
                                key={item.id} 
                                onClick={() => setSelectedItemId(item.id)}
                                className={cn(
                                    "cursor-pointer transition-all",
                                    selectedItemId === item.id ? "ring-2 ring-primary ring-offset-2" : "ring-0"
                                )}
                            >
                                <CardContent className="p-2">
                                <Image src={item.imageUrl} alt={item.name} width={200} height={150} className="w-full h-24 object-cover rounded-md" />
                                <p className="text-sm font-medium truncate mt-2">{item.name}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You have no available items for a {receiverTradePreference} swap.</p>
                        <Button asChild>
                            <Link href="/items/new"><PlusCircle className="mr-2"/> List a New Item</Link>
                        </Button>
                    </div>
                )}
                </div>
            </div>
            <div>
                <Label htmlFor="message">Add an optional message:</Label>
                <Textarea 
                    id="message" 
                    placeholder={`Hi ${receiver.username}, I'd like to propose a trade...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2"
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
                onClick={handleProposeTrade} 
                disabled={!selectedItemId || isSubmitting}
            >
                {isSubmitting ? 'Sending Request...' : 'Send Trade Request'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
