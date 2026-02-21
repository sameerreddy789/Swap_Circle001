'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, CheckCheck } from "lucide-react";
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, writeBatch } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function Notifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'notifications'), 
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection(notificationsQuery);
  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = (notification) => {
    if (!user || !firestore) return;
    
    // Mark non-blockingly
    if (!notification.read) {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        updateDocumentNonBlocking(notifRef, { read: true });
    }
    
    // Navigate
    if (notification.link) {
        router.push(notification.link);
    }

    setIsOpen(false);
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user || !firestore || unreadCount === 0) return;
    
    const batch = writeBatch(firestore);
    unreadNotifications.forEach(notif => {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
    });

    try {
        await batch.commit();
        toast({ title: "Success", description: "All notifications marked." });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not mark notifications." });
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.5} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-[100]">
            <div className="p-3 border-b flex justify-between items-center">
                <h3 className="font-medium text-sm text-foreground">Notifications</h3>
                 {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto px-2 py-1 text-xs">
                        <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                        Mark all
                    </Button>
                )}
            </div>
            <ScrollArea className="h-96">
                {notifications && notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div 
                         key={notif.id}
                         onClick={() => handleNotificationClick(notif)} 
                         className={cn(
                            "block p-3 hover:bg-accent cursor-pointer",
                            !notif.read && "bg-primary/10"
                         )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn("mt-1 h-2 w-2 flex-shrink-0 rounded-full", !notif.read ? "bg-primary" : "bg-transparent")}></div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-foreground">{notif.title}</p>
                                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : '...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2" />
                        <p>You have no new notifications.</p>
                    </div>
                )}
            </ScrollArea>
        </PopoverContent>
    </Popover>
  );
}