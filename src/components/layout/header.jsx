'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useUser, useAuth, useDoc, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useRouter } from 'next/navigation';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { ThemeToggle } from '../ui/theme-toggle';
import BackButton from './back-button';
import { Separator } from '../ui/separator';


const Logo = () => (
    <Link href="/" className="logo-wrap flex items-center gap-3">
        <div className="glass-circle">
            <svg className="arrows" viewBox="0 0 24 24">
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--gold-1)"/>
                    <stop offset="30%" stopColor="var(--gold-2)"/>
                    <stop offset="70%" stopColor="var(--gold-3)"/>
                    <stop offset="100%" stopColor="var(--gold-4)"/>
                    </linearGradient>
                </defs>
                <path d="M17 1l4 4-4 4V6H7a4 4 0 00-4 4v1H1v-1a6 6 0 016-6h10V1zM7 23l-4-4 4-4v3h10a4 4 0 004-4v-1h2v1a6 6 0 01-6 6H7v3z"/>
            </svg>
        </div>
        <div className="logo-text">SwapCircle</div>
    </Link>
);


const Header = () => {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const isUserLoading = isAuthLoading || isProfileLoading;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const getAvatarFallback = (name) => {
    if (!name) return 'U';
    const initials = name.split(' ').map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  }

  return (
    <header className="bg-card/80 border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto grid grid-cols-3 h-20 items-center px-4 md:px-6">
        <div className='flex items-center gap-2 justify-start'>
          <BackButton />
          <ThemeToggle />
        </div>
        
        <div className="flex justify-center">
            <Logo />
        </div>

        <div className="flex items-center gap-4 justify-end">
          {isUserLoading ? (
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            </div>
          ) : user ? (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-[var(--gold-3)] hover:border-[var(--gold-2)] hover:border-[3px] transition-all duration-300">
                      <AvatarImage src={userProfile?.profilePictureUrl || user.photoURL || undefined} alt={userProfile?.username || user.displayName || 'User'} />
                      <AvatarFallback>{getAvatarFallback(userProfile?.username || user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px] bg-popover text-popover-foreground border-border">
                  <SheetHeader>
                    <SheetTitle>My Account</SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                     <div className="flex flex-col space-y-1 font-normal mb-4">
                      <p className="text-sm font-medium leading-none">{userProfile?.username || user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-2 mt-4">
                       <SheetClose asChild>
                         <Button variant="ghost" className="justify-start border p-2" asChild>
                            <Link href={`/profile/${user.uid}`} className="flex items-center"><User className="mr-2 h-4 w-4" /> Profile</Link>
                          </Button>
                       </SheetClose>
                       <SheetClose asChild>
                          <Button variant="ghost" onClick={handleLogout} className="justify-start flex items-center border p-2">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                          </Button>
                       </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="text-foreground hover:bg-accent/10 rounded-full">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
