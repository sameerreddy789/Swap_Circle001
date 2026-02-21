'use client';

import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import TradeCard from "@/components/trade-card";
import ConversationView from "@/components/conversation-view";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLoading } from "@/hooks/use-loading";

export default function InboxPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [selectedTradeId, setSelectedTradeId] = useState(null);
    const { toast } = useToast();
    const { showLoader, hideLoader } = useLoading();

    const tradesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'trades'),
            where('participants', 'array-contains', user.uid)
        );
    }, [firestore, user]);

    const { data: allTradesData, isLoading: tradesLoading } = useCollection(tradesQuery);
    const allTradesLoading = tradesLoading || isUserLoading;
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/inbox');
        }
    }, [isUserLoading, user, router]);

    const sortedTrades = useMemo(() => {
        if (!allTradesData) return [];
        return [...allTradesData].sort((a, b) => {
            if (!a.updatedAt || !b.updatedAt) return 0;
            return b.updatedAt.toMillis() - a.updatedAt.toMillis()
        });
    }, [allTradesData]);

    const invitations = useMemo(() => sortedTrades?.filter(t => t.status === 'pending' && t.receiverId === user?.uid) || [], [sortedTrades, user]);
    const sentTrades = useMemo(() => sortedTrades?.filter(t => t.status === 'pending' && t.proposerId === user?.uid) || [], [sortedTrades, user]);
    const activeTrades = useMemo(() => sortedTrades?.filter(t => ['accepted', 'on-loan', 'return-pending'].includes(t.status)) || [], [sortedTrades]);
    const historyTrades = useMemo(() => sortedTrades?.filter(t => ['completed', 'rejected', 'cancelled'].includes(t.status)) || [], [sortedTrades]);

    const selectedTrade = useMemo(() => {
        if (!selectedTradeId) return null;
        return allTradesData?.find(t => t.id === selectedTradeId) || null;
    }, [selectedTradeId, allTradesData]);

    useEffect(() => {
        if (selectedTradeId && !allTradesData?.find(t => t.id === selectedTradeId)) {
            setSelectedTradeId(null);
        }
    }, [allTradesData, selectedTradeId]);

    const handleAccept = async (trade) => {
        if (!firestore || !user || trade.receiverId !== user.uid) return;
        showLoader();
        const tradeRef = doc(firestore, 'trades', trade.id);
        try {
            await updateDoc(tradeRef, {
                status: 'accepted',
                updatedAt: serverTimestamp(),
            });
            toast({ title: "Trade Accepted!", description: "You can now chat with the other user." });
            setTimeout(() => { hideLoader(); }, 1200);
        } catch (error) {
            console.error("Error accepting trade:", error);
            toast({ variant: "destructive", title: "Error accepting trade.", description: error.message || "Please try again." });
            hideLoader();
        }
    };

    const handleReject = async (trade) => {
        if (!firestore) return;
        const tradeRef = doc(firestore, 'trades', trade.id);
        await updateDoc(tradeRef, { status: 'rejected', updatedAt: serverTimestamp() });
        toast({ title: "Trade rejected ❌" });
        setSelectedTradeId(null);
    };

    const handleCancel = async (trade) => {
        if (!firestore || !user || trade.proposerId !== user.uid) return;
        const tradeRef = doc(firestore, 'trades', trade.id);
        await updateDoc(tradeRef, {
            status: 'cancelled',
            cancelledBy: user.uid,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        toast({ title: "Trade Cancelled" });
        setSelectedTradeId(null);
    }

    const handleCloseConversation = () => { setSelectedTradeId(null); };

    const handlePermanentComplete = async (trade) => {
        if (!firestore || !trade || !user) return;
        const tradeRef = doc(firestore, 'trades', trade.id);
        const currentTradeData = allTradesData?.find(t => t.id === trade.id);
        if (!currentTradeData) return;
        
        const isProposer = user.uid === trade.proposerId;
        const userRoleField = isProposer ? 'proposer' : 'receiver';
        const otherUserRoleField = isProposer ? 'receiver' : 'proposer';
    
        const alreadyAgreed = currentTradeData[`${userRoleField}AgreedStart`];
        if (alreadyAgreed) {
            toast({ title: "Already Confirmed", description: "You've already confirmed this trade." });
            return;
        }
    
        const otherUserAgreed = currentTradeData[`${otherUserRoleField}AgreedStart`];
    
        try {
            if (otherUserAgreed) {
                await updateDoc(tradeRef, {
                    status: 'completed',
                    updatedAt: serverTimestamp(),
                    [`${userRoleField}AgreedStart`]: true
                });
                toast({ title: "Trade Completed! ✅", description: "This trade is now in your history." });
            } else {
                updateDocumentNonBlocking(tradeRef, {
                    [`${userRoleField}AgreedStart`]: true,
                    updatedAt: serverTimestamp()
                });
                toast({ title: "Confirmation Sent!", description: "Waiting for the other user to mark the trade." });
            }
        } catch (error) {
            console.error("Error during trade completion logic:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the trade. Please try again.' });
        }
    }
    
    if (isUserLoading) { return <InboxSkeleton />; }
    if (!isUserLoading && !user) {
        return <div className="flex h-full items-center justify-center"><p>Please log in to see your inbox.</p></div>
    }

    return (
        <div className="h-[calc(100vh-5rem)] flex md:grid md:grid-cols-3">
            <aside className={cn(
                "w-full md:w-auto md:col-span-1 md:flex flex-col border-r overflow-y-auto transition-transform duration-300 ease-in-out",
                selectedTradeId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4"><h1 className="text-2xl font-bold">Inbox</h1></div>
                <Tabs defaultValue="invitations" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="invitations">Invitations</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="sent">Sent</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="invitations">
                        {allTradesLoading ? <TradeListSkeleton /> : (
                            invitations.length > 0 ? invitations.map(trade => (
                                <TradeCard key={trade.id} trade={trade} currentUserId={user.uid} onSelect={() => setSelectedTradeId(trade.id)} isSelected={selectedTrade?.id === trade.id} />
                            )) : <p className="p-4 text-muted-foreground">No new invitations.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="active">
                         {allTradesLoading ? <TradeListSkeleton /> : (
                           activeTrades.length > 0 ? activeTrades.map(trade => (
                                <TradeCard key={trade.id} trade={trade} currentUserId={user.uid} onSelect={() => setSelectedTradeId(trade.id)} isSelected={selectedTrade?.id === trade.id} onMarkComplete={handlePermanentComplete} />
                            )) : <p className="p-4 text-muted-foreground">No active trades.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="sent">
                        {allTradesLoading ? <TradeListSkeleton /> : (
                           sentTrades.length > 0 ? sentTrades.map(trade => (
                                <TradeCard key={trade.id} trade={trade} currentUserId={user.uid} onSelect={() => setSelectedTradeId(trade.id)} isSelected={selectedTrade?.id === trade.id} />
                            )) : <p className="p-4 text-muted-foreground">No sent requests.</p>
                        )}
                    </TabsContent>
                     <TabsContent value="history">
                         {allTradesLoading ? <TradeListSkeleton /> : (
                           historyTrades?.length ? historyTrades.map(trade => (
                                <TradeCard key={trade.id} trade={trade} currentUserId={user.uid} onSelect={() => setSelectedTradeId(trade.id)} isSelected={selectedTrade?.id === trade.id} />
                            )) : <p className="p-4 text-muted-foreground">No trade history.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </aside>
            <main className={cn("md:col-span-2 flex-col", selectedTradeId ? "flex" : "hidden md:flex")}>
                {selectedTrade ? (
                    <ConversationView trade={selectedTrade} currentUserId={user.uid} onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} onClose={handleCloseConversation} onMarkComplete={handlePermanentComplete} />
                ) : (
                    <div className="flex-1 items-center justify-center text-muted-foreground hidden md:flex">
                        {allTradesLoading ? <p>Loading...</p> : <p>Select a trade to view the conversation.</p>}
                    </div>
                )}
            </main>
        </div>
    );
}

function InboxSkeleton() {
    return (
        <div className="h-[calc(100vh-5rem)] flex animate-pulse">
            <aside className="w-full md:w-1/3 border-r p-4 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <div className="grid grid-cols-4 gap-2">
                    <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
                </div>
                <TradeListSkeleton />
            </aside>
            <main className="hidden md:flex w-2/3 items-center justify-center"><p className="text-muted-foreground">Loading trades...</p></main>
        </div>
    );
}

function TradeListSkeleton() {
    return (
        <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                </div>
            ))}
        </div>
    );
}
