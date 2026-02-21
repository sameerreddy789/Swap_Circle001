'use client';

import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import Header from '@/components/layout/header';
import ConditionalFooter from '@/components/layout/conditional-footer';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { LoadingProvider } from '@/hooks/use-loading';
import LoadingOverlay from '@/components/ui/loading-overlay';

const navItems = [
  { label: 'Home', icon: 'Home', href: '/' },
  { label: 'Browse', icon: 'Search', href: '/items' },
  { label: 'List', icon: 'PlusCircle', href: '/items/new' },
  { label: 'My Items', icon: 'Package', href: '/my-items' },
  { label: 'Inbox', icon: 'MessageSquare', href: '/inbox' },
];

export default function LayoutShell({ children }) {
  const scrollDirection = useScrollDirection();
  const pathname = usePathname();

  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const noNavRoutes = [...authRoutes, '/inbox'];
  const showNav = !noNavRoutes.includes(pathname);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <FirebaseClientProvider>
        <LoadingProvider>
          <LoadingOverlay />
          <Header />
          <main className={cn("flex-1", showNav && "pb-24 sm:pb-28")}>
            {children}
          </main>
          {showNav && (
            <div className={cn(
              "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
              scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
            )}>
              <InteractiveMenu items={navItems} />
            </div>
          )}
          <ConditionalFooter />
          <Toaster />
        </LoadingProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
