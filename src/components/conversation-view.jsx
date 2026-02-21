'use client';

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, ArrowRightLeft, CheckCircle, Star, Lock, Trash2, CalendarDays, Undo2, Hourglass, Timer, X, MoreVertical, ShieldAlert, UserX, Ban, ArrowLeft } from "lucide-react";
import { useFirestore, useCollection, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc, updateDoc, addDoc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useState, useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import ReviewDialog from "./review-dialog";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import ReportDialog from "./report-dialog";
import BlockDialog from "./block-dialog";
import { getDoc } from "firebase/firestore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

function SwapTimer({ startDate, durationDays }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const endTime = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
            const difference = endTime.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft("Time's up! Please arrange to return the items.");
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);

            let timeString = "";
            if (days > 0) {
                timeString += `${days} ${days > 1 ? 'days' : 'day'} `;
            }
            if (hours > 0 || days === 0) {
                timeString += `${hours} ${hours > 1 ? 'hours' : 'hour'} `;
            }
            
            if (timeString === "") {
                 const minutes = Math.floor((difference / 1000 / 60) % 60);
                 if(minutes > 0) {
                    timeString = `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} remaining`;
                 } else {
                    const seconds = Math.floor((difference / 1000) % 60);
                    timeString = `${seconds} ${seconds > 1 ? 'seconds' : 'second'} remaining`;
                 }
            } else {
                timeString += "remaining";
            }

            setTimeLeft(timeString);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [startDate, durationDays]);

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4 text-sm font-medium text-amber-600 dark:text-amber-500">
             <Timer className="h-5 w-5 flex-shrink-0" />
            <p><span className="font-bold text-card-foreground">Swap is active</span> | {timeLeft}</p>
        </div>
    );
}


export default function ConversationView({ trade, currentUserId, onAccept, onReject, onCancel, onClose, onMarkComplete }) {
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = useState("");
    const [isReviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [isReportDialogOpen, setReportDialogOpen] = useState(false);
    const [isBlockDialogOpen, setBlockDialogOpen] = useState(false);
    const scrollAreaRef = useRef(null);

    const isChatEnabled = useMemo(() => ['accepted', 'on-loan', 'return-pending'].includes(trade.status), [trade.status]);
    const { toast } = useToast();

    const messagesQuery = useMemoFirebase(() => {
        if (!trade?.id || !firestore || !isChatEnabled) return null;
        return query(
            collection(firestore, 'trades', trade.id, 'messages'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, trade.id, isChatEnabled]);

    const { data: messages } = useCollection(messagesQuery);
    
    const messagesCollection = useMemoFirebase(() => {
        if (!trade?.id || !firestore) return null;
        return collection(firestore, 'trades', trade.id, 'messages');
    }, [firestore, trade.id]);
    
    const isProposer = currentUserId === trade.proposerId;
    const otherUser = isProposer ? { id: trade.receiverId, username: trade.receiverUsername } : { id: trade.proposerId, username: trade.proposerUsername };
    
    const currentUserProfileRef = useMemoFirebase(() => doc(firestore, 'users', currentUserId), [firestore, currentUserId]);
    const otherUserProfileRef = useMemoFirebase(() => doc(firestore, 'users', otherUser.id), [firestore, otherUser.id]);
    
    const { data: currentUserProfile } = useDoc(currentUserProfileRef);
    const { data: otherUserProfile } = useDoc(otherUserProfileRef);

    const amIBlocked = useMemo(() => otherUserProfile?.blockedUsers?.includes(currentUserId), [otherUserProfile, currentUserId]);
    const haveIBlocked = useMemo(() => currentUserProfile?.blockedUsers?.includes(otherUser.id), [currentUserProfile, otherUser.id]);

     useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !messagesCollection) return;
        
        const messageData = {
            tradeId: trade.id,
            senderId: currentUserId,
            text: newMessage.trim(),
            createdAt: serverTimestamp(),
        };

        addDoc(messagesCollection, messageData).catch((err) => {
            const permissionError = new FirestorePermissionError({
                path: messagesCollection.path,
                operation: 'create',
                requestResourceData: messageData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Message Not Sent',
                description: 'You may not have permission to send messages in this trade.',
            });
        });
        
        const tradeRef = doc(firestore, 'trades', trade.id);
        updateDocumentNonBlocking(tradeRef, { updatedAt: serverTimestamp() });
        setNewMessage("");
    };

    const userRoleField = isProposer ? 'proposer' : 'receiver';
    const otherUserRoleField = isProposer ? 'receiver' : 'proposer';

    const handleReturn = async () => {
        if (!firestore) return;
        const tradeRef = doc(firestore, 'trades', trade.id);

        const tradeDoc = await getDoc(tradeRef);
        if (!tradeDoc.exists()) {
            toast({ variant: "destructive", title: "Error", description: "Trade not found." });
            return;
        }
        const currentTradeData = tradeDoc.data();

        const alreadyAgreed = currentTradeData[`${userRoleField}AgreedReturn`];
        if(alreadyAgreed) {
            toast({ title: "Already Confirmed", description: "You've already confirmed the item return." });
            return;
        }

        const otherUserAgreed = currentTradeData[`${otherUserRoleField}AgreedReturn`];

        if (otherUserAgreed) {
            try {
                await updateDoc(tradeRef, { status: 'completed', updatedAt: serverTimestamp() });
                toast({ title: "Items Returned!", description: "The swap is now complete. You can leave a review." });
                setReviewDialogOpen(true);
            } catch (e) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not finalize the return.' });
            }
        } else {
            updateDocumentNonBlocking(tradeRef, { 
                [`${userRoleField}AgreedReturn`]: true, 
                status: 'return-pending',
                updatedAt: serverTimestamp() 
            });
            toast({ title: "Return Confirmed", description: "Waiting for the other user to confirm the return." });
        }
    };

    const isReceiver = currentUserId === trade.receiverId;
    const hasUserReviewed = (isProposer && trade.reviewedByProposer) || (isReceiver && trade.reviewedByReceiver);
    const userAgreedReturn = !!trade[`${userRoleField}AgreedReturn`];
    
    const getReturnButtonState = () => {
        if (userAgreedReturn) {
            return { text: "Waiting for other user...", disabled: true, icon: <Hourglass className="mr-2 h-4 w-4 animate-spin" /> };
        }
        return { text: "Confirm Item Return", disabled: false, icon: <Undo2 className="mr-2 h-4 w-4" /> };
    }

    const canChat = isChatEnabled && !amIBlocked && !haveIBlocked;

    const renderActionButtons = () => {
        switch (trade.status) {
            case 'pending':
                if (isReceiver) {
                    return (
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => onAccept(trade)}>✅ Accept</Button>
                            <Button variant="destructive" className="flex-1" onClick={() => onReject(trade)}>❌ Reject</Button>
                        </div>
                    );
                }
                return (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Request
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will cancel your trade request with {otherUser.username}. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onCancel(trade)} className="bg-destructive hover:bg-destructive/80">Yes, Cancel</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            
            case 'on-loan':
            case 'return-pending': {
                const { text, disabled, icon } = getReturnButtonState();
                return (
                    <Button className="w-full" variant="secondary" onClick={handleReturn} disabled={disabled}>
                        {icon}{text}
                    </Button>
                );
            }
            
            case 'completed':
                 return (
                    <Button className="w-full" variant="secondary" onClick={() => setReviewDialogOpen(true)} disabled={hasUserReviewed}>
                        <Star className="mr-2 h-4 w-4"/>
                        {hasUserReviewed ? 'Review Submitted' : 'Leave a Review'}
                    </Button>
                );

            case 'rejected':
            case 'cancelled':
                return <Badge variant="destructive" className="w-full justify-center p-2 text-sm">❌ Trade {trade.status}</Badge>;

            default:
                return null;
        }
    }

    return (
        <>
            <ReviewDialog
                isOpen={isReviewDialogOpen}
                onOpenChange={setReviewDialogOpen}
                trade={trade}
                currentUser={{ uid: currentUserId, displayName: isProposer ? trade.proposerUsername : trade.receiverUsername }}
                otherUser={otherUser}
            />
            <ReportDialog
                isOpen={isReportDialogOpen}
                onOpenChange={setReportDialogOpen}
                trade={trade}
                reporterId={currentUserId}
                reportedUser={otherUser}
            />
            <BlockDialog
                isOpen={isBlockDialogOpen}
                onOpenChange={setBlockDialogOpen}
                currentUserProfileRef={currentUserProfileRef}
                userToBlock={otherUser}
                isBlocked={haveIBlocked}
            />
            <div className="flex flex-col h-full">
                <header className="p-4 border-b flex-shrink-0">
                     <Card className="relative">
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onClose}>
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                     <DropdownMenuItem onSelect={() => setReportDialogOpen(true)}>
                                        <ShieldAlert className="mr-2 h-4 w-4" />
                                        <span>Report User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setBlockDialogOpen(true)} className={cn(haveIBlocked && 'text-destructive')}>
                                        {haveIBlocked ? <UserX className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                        <span>{haveIBlocked ? 'Unblock' : 'Block'} User</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:inline-flex" onClick={onClose}>
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>
                        <CardHeader className="p-4 pr-20">
                           <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="capitalize">{trade.tradeType} Trade with {otherUser.username}</CardTitle>
                                    <CardDescription>Proposed on {trade.createdAt ? new Date(trade.createdAt.seconds * 1000).toLocaleDateString() : '...'}</CardDescription>
                                </div>
                                {trade.tradeType === 'temporary' && (
                                     <Badge variant="outline" className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4" />
                                        {trade.durationDays} day swap
                                    </Badge>
                                )}
                           </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src={trade.receiverItemImageUrl} alt={trade.receiverItemName} width={50} height={50} className="rounded-md object-cover"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Their Item</p>
                                    <p className="font-semibold text-card-foreground">{trade.receiverItemName}</p>
                                </div>
                            </div>
                            <ArrowRightLeft className="h-6 w-6 text-primary mx-4" />
                            <div className="flex items-center gap-2">
                                <Image src={trade.proposerItemImageUrl} alt={trade.proposerItemName} width={50} height={50} className="rounded-md object-cover"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">{isProposer ? "Your Offer" : "Their Offer"}</p>
                                    <p className="font-semibold text-card-foreground">{trade.proposerItemName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </header>

                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    {!isChatEnabled ? (
                        <div className="space-y-4">
                            <div className="text-center p-8 bg-muted rounded-lg">
                                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold">Chat is Locked</h3>
                                <p className="text-muted-foreground">
                                    {trade.status === 'pending' && 'Chat will be unlocked once the trade is accepted.'}
                                    {trade.status === 'completed' && 'This trade is complete. Chat is disabled.'}
                                    {trade.status === 'rejected' && 'This trade was rejected.'}
                                    {trade.status === 'cancelled' && 'This trade was cancelled.'}
                                </p>
                            </div>
                             <div className="space-y-2">
                                {renderActionButtons()}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pr-4">
                            {messages?.map(message => (
                                <div key={message.id} className={cn("flex", message.senderId === currentUserId ? "justify-end" : "justify-start")}>
                                    <div className={cn("rounded-lg px-4 py-2 max-w-sm", message.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <p>{message.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                {canChat && (
                    <footer className="p-4 border-t sticky bottom-0 bg-background/80 backdrop-blur-sm space-y-4">
                        <div className="flex gap-2">
                             {trade.status === 'accepted' && trade.tradeType === 'permanent' && onMarkComplete && (
                                <div className="w-full">
                                    {(() => {
                                        const btnState = {
                                            text: trade[`${userRoleField}AgreedStart`] ? "Waiting for other..." : "Mark",
                                            disabled: !!trade[`${userRoleField}AgreedStart`],
                                            icon: trade[`${userRoleField}AgreedStart`] ? <Hourglass className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />
                                        };
                                        return (
                                            <Button size="sm" className="w-full" variant="secondary" onClick={() => onMarkComplete(trade)} disabled={btnState.disabled}>
                                                {btnState.icon}{btnState.text}
                                            </Button>
                                        )
                                    })()}
                                </div>
                            )}
                            {renderActionButtons()}
                        </div>
                        {trade.status === 'on-loan' && trade.tradeType === 'temporary' && trade.updatedAt && (
                            <SwapTimer startDate={trade.updatedAt.toDate()} durationDays={trade.durationDays} />
                        )}
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Type your message..." 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                disabled={!canChat}
                            />
                            <Button onClick={handleSendMessage} disabled={!canChat}><Send /></Button>
                        </div>
                         {haveIBlocked && <p className="text-xs text-destructive text-center">You have blocked this user. Unblock them to send messages.</p>}
                         {amIBlocked && <p className="text-xs text-destructive text-center">You cannot reply to this conversation.</p>}
                    </footer>
                )}
            </div>
        </>
    );
}
