'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Star, Award, MapPin, ChevronRight, AlertTriangle, LogIn, CalendarClock, Target } from "lucide-react";
import { useDoc, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore, useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from 'next/navigation';
import { useState } from "react";
import RequestTradeDialog from "@/components/request-trade-dialog";
import SaveItemButton from "@/components/save-item-button";

export default function ItemDetailPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    const router = useRouter();
    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);

    const itemRef = useMemoFirebase(() => {
        if (!params?.id) return null;
        return doc(firestore, "items", params.id);
    }, [firestore, params?.id]);

    const { data: item, isLoading: isItemLoading } = useDoc(itemRef);

    const userProfileRef = useMemoFirebase(() => {
        if (!item?.ownerId) return null;
        return doc(firestore, "users", item.ownerId);
    }, [firestore, item?.ownerId]);

    const { data: owner, isLoading: isOwnerLoading } = useDoc(userProfileRef);

    const handleTradeRequest = () => {
        if (!currentUser) {
            router.push(`/login?redirect=/items/${item?.id}`);
            return;
        }
        setIsTradeDialogOpen(true);
    }
    
    if (isCurrentUserLoading || (item && isOwnerLoading)) { return <ItemDetailSkeleton />; }
    if (!isItemLoading && !item) {
        return (
            <div className="container mx-auto py-12 px-4 md:px-6 text-center">
                <div className="flex justify-center items-center flex-col gap-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h1 className="text-2xl font-bold">Item Not Found</h1>
                    <p className="text-muted-foreground">This item might have been removed or the link is incorrect.</p>
                    <Button asChild><Link href="/items">Browse Other Items</Link></Button>
                </div>
            </div>
        )
    }
    if (isItemLoading) { return <ItemDetailSkeleton />; }

    const isOwnItem = currentUser?.uid === item?.ownerId;
    const itemLocation = item?.location;
    const profileLink = isOwnItem ? `/profile/${owner?.id}` : `/users/${owner?.id}`;

    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            {item && owner && <RequestTradeDialog isOpen={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen} receiverItem={item} receiver={owner} />}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="md:col-span-2">
                    <Card className="overflow-hidden shadow-lg bg-card/90">
                        <CardContent className="p-0">
                            <Image src={item?.imageUrl || ''} alt={item?.name || 'Item image'} width={800} height={600} className="w-full object-cover" data-ai-hint={item?.imageHint} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{item?.name}</h1>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{item?.category}</Badge>
                            <Badge variant="outline">{item?.condition}</Badge>
                            {itemLocation && <Badge variant="outline" className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{itemLocation}</Badge>}
                        </div>
                    </div>
                    {item?.tradePreference && (
                        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                            <CalendarClock className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-card-foreground">Trade Preference</p>
                                {item.tradePreference === 'temporary' ? (
                                    <p className="text-muted-foreground">Temporary Swap ({item.loanDurationDays} days)</p>
                                ) : (
                                    <p className="text-muted-foreground">Permanent Swap</p>
                                )}
                            </div>
                        </div>
                    )}
                    <p className="text-muted-foreground text-base">{item?.description}</p>
                    {item?.lookingFor && (
                        <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4">
                           <Target className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-card-foreground">Looking For</p>
                                <p className="text-muted-foreground">{item.lookingFor}</p>
                            </div>
                        </div>
                    )}
                    {item?.landmark && (
                        <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4">
                           <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-card-foreground">Location Details</p>
                                <p className="text-muted-foreground">{item.landmark}, {item.location}</p>
                            </div>
                        </div>
                    )}
                    {!isOwnItem && item && (
                        <div className="flex items-center gap-3">
                            <Button size="lg" className="w-full" onClick={handleTradeRequest} disabled={!currentUser}>
                                {currentUser ? 'Request a Trade' : 'Log In to Trade'}
                            </Button>
                             {currentUser && <SaveItemButton itemId={item.id} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ItemDetailSkeleton() {
    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="md:col-span-2"><Skeleton className="w-full h-[600px] rounded-lg" /></div>
                <div className="space-y-6">
                    <div className="space-y-4"><Skeleton className="h-10 w-3/4" /><div className="flex gap-2"><Skeleton className="h-6 w-24" /><Skeleton className="h-6 w-32" /></div></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
                    <Separator />
                    <Card><CardContent className="p-4 flex items-center gap-4"><Skeleton className="w-16 h-16 rounded-full" /><div className="space-y-2 flex-grow"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /></div></CardContent></Card>
                    <div className="flex flex-col gap-3"><Skeleton className="h-12 w-full" /></div>
                </div>
            </div>
        </div>
    );
}
