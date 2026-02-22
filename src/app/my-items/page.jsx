
'use client';

import { useUser, useFirestore, useCollection, deleteDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, PlusCircle, Package, Bookmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItemCard from "@/components/item-card";

function MyItemsPageSkeleton() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 mb-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Skeleton className="h-10 w-full mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyItemsPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login?redirect=/my-items');
    }
  }, [isAuthLoading, user, router]);

  // Query for items owned by the user
  const myItemsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, "items"), where("ownerId", "==", user.uid));
  }, [firestore, user]);
  const { data: myItems, isLoading: myItemsLoading } = useCollection(myItemsQuery);

  // Memoize user profile to get saved item IDs
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: profileLoading } = useDoc(userProfileRef);

  const savedItemIds = useMemo(() => userProfile?.savedItems || [], [userProfile]);

  // Query for saved items
  const savedItemsQuery = useMemoFirebase(() => {
    if (!user || savedItemIds.length === 0) return null;
    // Firestore 'in' queries require a non-empty array.
    // To prevent an error, we can return null or query for a dummy that won't exist.
    return query(collection(firestore, "items"), where('__name__', 'in', savedItemIds));
  }, [firestore, user, savedItemIds]);
  const { data: savedItems, isLoading: savedItemsLoading } = useCollection(savedItemsQuery);


  const isLoading = isAuthLoading || myItemsLoading || profileLoading || (savedItemIds.length > 0 && savedItemsLoading);

  const handleRemoveItem = async (itemId) => {
    if (!firestore) return;
    setIsDeleting(itemId);
    toast({
        title: "Removing Item...",
        description: "Please wait while we remove your item.",
    });

    try {
        const itemRef = doc(firestore, 'items', itemId);
        // This will now only delete the item document.
        // A Cloud Function will handle deleting associated trades.
        deleteDocumentNonBlocking(itemRef);

        toast({
            title: "Item Removed Successfully",
            description: "Your item has been deleted.",
        });

    } catch (error) {
        console.error("Error removing item:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not remove the item. Please try again.",
        });
    } finally {
        setIsDeleting(null);
    }
  };

  if (isLoading || !user) {
    return <MyItemsPageSkeleton />;
  }
  
  const sortedItems = myItems?.sort((a, b) => (b.createdAt?.toDate() ?? 0) - (a.createdAt?.toDate() ?? 0));

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">My Items</h1>
        <p className="text-muted-foreground text-lg">Manage items you've listed and saved.</p>
      </div>

       <Tabs defaultValue="listed" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="listed">My Listed Items</TabsTrigger>
                <TabsTrigger value="saved">My Saved Items</TabsTrigger>
            </TabsList>
            <TabsContent value="listed" className="mt-6">
                {sortedItems && sortedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {sortedItems.map(item => (
                           <div key={item.id} className="space-y-2">
                                <ItemCard item={item} />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full rounded-full" disabled={isDeleting === item.id}>
                                      {isDeleting === item.id ? (
                                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      {isDeleting === item.id ? 'Deleting...' : 'Delete'}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove "{item.name}" and any active or pending trades associated with it.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Yes, Delete Item
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg border-border mt-6">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold text-foreground">You haven't listed any items yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">List an item to start swapping with the community.</p>
                        <div className="mt-6">
                            <Button asChild>
                                <Link href="/items/new">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    List Your First Item
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="saved" className="mt-6">
                 {savedItems && savedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                       {savedItems.map(item => (
                           <ItemCard key={item.id} item={item} />
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg border-border mt-6">
                        <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold text-foreground">Your wishlist is empty</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Save items you're interested in to see them here.</p>
                        <div className="mt-6">
                            <Button asChild variant="outline" className="rounded-full">
                                <Link href="/items">Browse Items</Link>
                            </Button>
                        </div>
                    </div>
                 )}
            </TabsContent>
        </Tabs>
    </div>
  );
}
