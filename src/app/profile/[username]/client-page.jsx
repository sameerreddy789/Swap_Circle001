'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, AlertTriangle, Edit, Camera, Check, X, Repeat, Phone, MapPin, ChevronsUpDown, Star, Award, MessageSquare } from "lucide-react";
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useCollection } from "@/firebase";
import { query, collection, where, getDocs, limit, doc, or, orderBy, and, getCountFromServer } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { locations } from "@/lib/locations";
import { cn } from "@/lib/utils";
import { useMemoFirebase } from "@/firebase/provider";
import { Textarea } from "@/components/ui/textarea";
import ItemCard from "@/components/item-card";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { uploadImage } from "@/firebase/storage";


export default function ProfilePage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    
    const [displayName, setDisplayName] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [completedSwaps, setCompletedSwaps] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [openLocationPopover, setOpenLocationPopover] = useState(false);

    const userId = params.username;

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

    const activeTradesQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, "trades"), where("participants", "array-contains", userId), where("status", "in", ["accepted", "on-loan"]));
    }, [userId, firestore]);
    const { data: activeTrades, isLoading: areTradesLoading } = useCollection(activeTradesQuery);
    
    const reviewsQuery = useMemoFirebase(() => {
        if (!userId || !firestore) return null;
        return query(collection(firestore, 'users', userId, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
    }, [userId, firestore]);
    const { data: reviews, isLoading: areReviewsLoading } = useCollection(reviewsQuery);

    useEffect(() => {
        if (!isAuthLoading && !currentUser) {
            router.push(`/login?redirect=/profile/${params.username}`);
        }
    }, [isAuthLoading, currentUser, router, params.username]);

    useEffect(() => {
        const fetchCompletedSwaps = async () => {
            if (!userId || !firestore) return;
            const completedTradesQuery = query(collection(firestore, 'trades'), where('participants', 'array-contains', userId), where('status', '==', 'completed'));
            const snapshot = await getCountFromServer(completedTradesQuery);
            setCompletedSwaps(snapshot.data().count);
        };
        fetchCompletedSwaps();
    }, [userId, firestore]);

    useEffect(() => {
      setIsLoading(isAuthLoading || isProfileLoading || areItemsLoading || areTradesLoading || areReviewsLoading);
        if (userProfile) {
            setDisplayName(userProfile.username);
            setLocation(userProfile.location || "");
            setBio(userProfile.bio || "");
        }
    }, [isAuthLoading, isProfileLoading, userProfile, areItemsLoading, areTradesLoading, areReviewsLoading]);

    const handleFieldUpdate = async (field, value) => {
        if (!userProfile || !firestore) return;
        if (field === 'location' && value && !locations.includes(value)) {
             toast({ variant: 'destructive', title: 'Invalid Location', description: 'Please select a location from the list.' });
            return;
        }
        const userDocRef = doc(firestore, 'users', userProfile.id);
        updateDocumentNonBlocking(userDocRef, { [field]: value });
        toast({ title: 'Success', description: `Your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.` });
        setIsEditing(null);
    };
    
    const handleProfilePicChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile || !firestore) return;

        setIsUploading(true);
        toast({ title: "Uploading...", description: "Your new profile picture is being uploaded." });
        
        try {
            const { url: newImageUrl } = await uploadImage(file);
            const userDocRef = doc(firestore, 'users', userProfile.id);
            updateDocumentNonBlocking(userDocRef, { profilePictureUrl: newImageUrl });
            toast({ title: 'Success!', description: 'Your profile picture has been updated.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload profile picture.' });
        } finally {
            setIsUploading(false);
        }
    };
    
    const isOwner = currentUser?.uid === userId;

    if (isLoading) { return <ProfilePageSkeleton />; }
    
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
    
    if (!isOwner) {
        router.push(`/users/${userProfile.id}`);
        return <ProfilePageSkeleton />;
    }

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
                                    {isOwner && (
                                        <>
                                            <Button size="icon" className="absolute bottom-12 right-[calc(50%-4.5rem)] rounded-full h-10 w-10 bg-primary hover:bg-primary/90" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Change profile picture">
                                                {isUploading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" /> : <Camera className="h-5 w-5" />}
                                            </Button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <EditableField isEditing={isEditing === 'username'} setIsEditing={() => setIsEditing('username')} onSave={(value) => handleFieldUpdate('username', value)} onCancel={() => { setIsEditing(null); setDisplayName(userProfile.username); }} label="Username" value={displayName} setValue={setDisplayName} isOwner={isOwner}>
                                    <h1 className="text-2xl font-bold">{userProfile.username}</h1>
                                </EditableField>
                                <EditableField isEditing={isEditing === 'bio'} setIsEditing={() => setIsEditing('bio')} onSave={(value) => handleFieldUpdate('bio', value)} onCancel={() => { setIsEditing(null); setBio(userProfile.bio || ''); }} label="Bio" value={bio} setValue={setBio} isOwner={isOwner} type="textarea">
                                    <p className="text-muted-foreground italic">{userProfile.bio || 'No bio yet.'}</p>
                                </EditableField>
                            </CardContent>
                             <Separator />
                            <CardContent className="p-6 space-y-4">
                                 <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-5 w-5" /><p>{userProfile.email}</p></div>
                                <EditableField isEditing={isEditing === 'location'} setIsEditing={() => setIsEditing('location')} onSave={(value) => handleFieldUpdate('location', value)} onCancel={() => { setIsEditing(null); setLocation(userProfile.location || ''); }} label="Location" value={location} setValue={setLocation} isOwner={isOwner} type="combobox">
                                    <div className="flex items-center gap-3 text-muted-foreground"><MapPin className="h-5 w-5" /><p>{userProfile.location || 'No location set'}</p></div>
                                </EditableField>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Completed Swaps</span>
                                    <motion.span key={completedSwaps} initial={{ scale: 1.5, color: "#2563eb" }} animate={{ scale: 1, color: "inherit" }} transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 15 }} className="font-bold text-blue-700 dark:text-emerald-400">{completedSwaps}</motion.span>
                                </div>
                                 <div className="flex justify-between items-center"><span className="font-medium">Active Trades</span><span className="font-bold">{activeTrades?.length || 0}</span></div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">My Items for Swap</h2>
                            {userItems && userItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{userItems.map(item => <ItemCard key={item.id} item={item} />)}</div>
                            ) : (<p className="text-muted-foreground">You haven't listed any items yet.</p>)}
                        </div>
                        <Separator />
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Reviews About You ({reviews?.length || 0})</h2>
                             {reviews && reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map(review => (
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
                            ) : (<p className="text-muted-foreground">You have no reviews yet.</p>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


const EditableField = ({ isEditing, setIsEditing, onSave, onCancel, label, value, setValue, isOwner, children, type = 'input' }) => {
    const [openCombobox, setOpenCombobox] = useState(false);
    
    if (isEditing && isOwner) {
        return (
            <div className="space-y-2">
                <Label className="text-primary text-sm">{label}</Label>
                <div className="flex items-start gap-2">
                    {type === 'textarea' ? (
                         <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="text-lg" rows={3}/>
                    ) : type === 'combobox' ? (
                         <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className={cn("w-full justify-between", !value && "text-muted-foreground")}>
                                    {value ? locations.find(loc => loc === value) : "Select location"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                                <Command>
                                    <CommandInput placeholder="Search location..." />
                                    <CommandEmpty>No location found.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {locations.map((loc) => (
                                                <CommandItem value={loc} key={loc} onSelect={() => { setValue(loc); setOpenCombobox(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", loc === value ? "opacity-100" : "opacity-0")} />
                                                    {loc}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Input value={value} onChange={(e) => setValue(e.target.value)} className="text-lg" />
                    )}
                    <Button size="icon" variant="ghost" onClick={() => onSave(value)}><Check className="h-5 w-5 text-green-600" /></Button>
                    <Button size="icon" variant="ghost" onClick={onCancel}><X className="h-5 w-5 text-red-600" /></Button>
                </div>
            </div>
        )
    }

    return (
        <div className="group relative">
            {children}
            {isOwner && (
                 <Button size="icon" variant="ghost" onClick={setIsEditing} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-5 w-5 text-muted-foreground" />
                </Button>
            )}
        </div>
    )
}

function ProfilePageSkeleton() {
    return (
        <div className="w-full bg-secondary/30 pt-8 pb-20 animate-pulse">
             <div className="container mx-auto px-4 md:px-6">
                 <div className="grid lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-1 space-y-8">
                        <Card className="w-full max-w-md mx-auto shadow-xl overflow-hidden">
                            <CardHeader className="bg-card p-0"><div className="relative aspect-square flex items-center justify-center"><Skeleton className="w-48 h-48 rounded-full" /></div></CardHeader>
                            <CardContent className="p-6 space-y-8"><Skeleton className="h-8 w-3/4 mx-auto" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
                            <Separator />
                            <CardContent className="p-6 space-y-6"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></CardContent>
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