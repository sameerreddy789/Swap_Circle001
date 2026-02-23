'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Star } from "lucide-react";
import { useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, query, collection, where, getCountFromServer, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useParams } from "next/navigation";
import { useMemoFirebase } from "@/firebase/provider";
import { useEffect, useState } from "react";
import ItemCard from "@/components/item-card";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";


export default function UserPage() {
    const params = useParams();
    const firestore = useFirestore();
    const userId = params.userId;
    const [completedSwaps, setCompletedSwaps] = useState(0);

    const userProfileRef = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return doc(firestore, "users", userId);
    }, [userId, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const userItemsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, "items"), where("ownerId", "==", userId));
    }, [userId, firestore]);
    const { data: userItems, isLoading: areItemsLoading } = useCollection(userItemsQuery);

    const reviewsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, 'users', userId, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
    }, [userId, firestore]);
    const { data: reviews, isLoading: areReviewsLoading } = useCollection(reviewsQuery);
    
    useEffect(() => {
        const fetchCompletedSwaps = async () => {
            if (!userId || !firestore) return;
            const completedTradesQuery = query(collection(firestore, 'trades'), where('participants', 'array-contains', userId), where('status', '==', 'completed'));
            const snapshot = await getCountFromServer(completedTradesQuery);
            setCompletedSwaps(snapshot.data().count);
        };
        fetchCompletedSwaps();
    }, [userId, firestore]);

    const isLoading = isProfileLoading || areItemsLoading || areReviewsLoading;
    if (isLoading) { return <UserPageSkeleton />; }
    
    if (!userProfile) {
        return (
            <div className="container mx-auto py-12 px-4 md:px-6 text-center">
                 <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>User Not Found</AlertTitle>
                    <AlertDescription>This profile could not be loaded.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const userHasReviews = userProfile.reviewCount && userProfile.reviewCount > 0;

    return (
        <div className="bg-secondary/20">
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <Card className="shadow-lg overflow-hidden">
                            <CardHeader className="bg-card p-0">
                                <div className="relative aspect-square flex items-center justify-center">
                                    <Avatar className="w-48 h-48 mb-4 border-8 border-background shadow-lg">
                                        <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.username} />
                                        <AvatarFallback className="text-6xl">{userProfile.username.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4 text-center">
                               <h1 className="text-2xl font-bold">{userProfile.username}</h1>
                               <p className="text-muted-foreground italic">{userProfile.bio || 'A member of the SwapCircle community.'}</p>
                                {userProfile.location && (
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{userProfile.location}</span></div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Completed Swaps</span>
                                    <motion.span key={completedSwaps} initial={{ scale: 1.5, color: "#2563eb" }} animate={{ scale: 1, color: "inherit" }} transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 15 }} className="font-bold text-blue-700 dark:text-emerald-400">{completedSwaps}</motion.span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Items for Swap</h2>
                            {userItems && userItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{userItems.filter(item => item.status === 'available').map(item => <ItemCard key={item.id} item={item} />)}</div>
                            ) : (<p className="text-muted-foreground">This user hasn't listed any available items yet.</p>)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Reviews {userHasReviews ? `(${userProfile.reviewCount})` : ''}</h2>
                            {userHasReviews ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4 p-4 bg-card rounded-lg">
                                        <Star className="w-6 h-6 text-yellow-500 fill-current" /><span className="text-xl font-bold">{userProfile.rating?.toFixed(1)}</span>
                                        <span className="text-muted-foreground">average rating from {userProfile.reviewCount} reviews.</span>
                                    </div>
                                    {reviews && reviews.map(review => (
                                        <Card key={review.id} className="bg-card">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold">{review.fromUsername}</p>
                                                                <p className="text-xs text-muted-foreground">{review.createdAt ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : ''}</p>
                                                            </div>
                                                            <div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}/>))}</div>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (<p className="text-muted-foreground">No reviews yet.</p>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserPageSkeleton() {
    return (
        <div className="w-full bg-secondary/30 pt-8 pb-20 animate-pulse">
             <div className="container mx-auto px-4 md:px-6">
                 <div className="grid lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-1 space-y-8">
                        <Card className="w-full shadow-xl overflow-hidden">
                            <CardHeader className="bg-card p-0"><div className="relative aspect-square flex items-center justify-center"><Skeleton className="w-48 h-48 rounded-full" /></div></CardHeader>
                            <CardContent className="p-6 space-y-4 text-center"><Skeleton className="h-8 w-3/4 mx-auto" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mx-auto" /></CardContent>
                        </Card>
                     </div>
                     <div className="lg:col-span-2 space-y-8">
                        <div><Skeleton className="h-8 w-48 mb-4" /><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{Array.from({length: 3}).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-40 w-full" /><Skeleton className="h-6 w-3/4" /></div>))}</div></div>
                         <div><Skeleton className="h-8 w-32 mb-4" /><div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div></div>
                     </div>
                 </div>
            </div>
        </div>
    );
}