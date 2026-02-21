
'use client';
import React, { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import { Home, Search, PlusCircle, Package, MessageSquare } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLoading } from '@/hooks/use-loading';

const iconMap = {
    Home,
    Search,
    PlusCircle,
    Package,
    MessageSquare,
};

const defaultItems: InteractiveMenuItem[] = [
    { label: 'Home', icon: 'Home', href: '/' },
    { label: 'Browse', icon: 'Search', href: '/items' },
    { label: 'List', icon: 'PlusCircle', href: '/items/new' },
    { label: 'My Items', icon: 'Package', href: '/my-items' },
    { label: 'Inbox', icon: 'MessageSquare', href: '/inbox' },
];

const InteractiveMenu = ({ items }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { showLoader } = useLoading();
  const menuRef = useRef(null);

  const finalItems = useMemo(() => {
     const navItems = [...defaultItems];
     const inboxItem = { label: 'Inbox', icon: 'MessageSquare', href: '/inbox' };
     if (!navItems.find(item => item.label === 'Inbox')) {
        navItems.push(inboxItem);
     }
     return navItems;
  }, []);

  useEffect(() => {
    const matchingItemIndex = finalItems.findIndex(item => pathname === item.href);

    if (matchingItemIndex !== -1) {
      setActiveIndex(matchingItemIndex);
    } else {
        const currentBasePath = pathname.split('/')[1];
        if (currentBasePath) {
             const baseMatchIndex = finalItems.findIndex(item => item.href.startsWith(`/${currentBasePath}`));
             if (baseMatchIndex !== -1) {
                 setActiveIndex(baseMatchIndex);
                 return;
             }
        }
        setActiveIndex(pathname === '/' ? 0 : -1);
    }
  }, [pathname, finalItems]);
  

  const handleItemClick = (href) => {
    if (pathname === href) return;
    showLoader(5000); // Show loader with a 5-second timeout
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className={cn("menu", isPending && "opacity-70")} role="navigation" ref={menuRef}>
      {finalItems.map((item, index) => {
        const isRouteActive = index === activeIndex;
        const IconComponent = iconMap[item.icon] || Home;

        return (
          <button
            key={item.label}
            className={cn('menu-item', { 
                'route-active': isRouteActive,
            })}
            onClick={() => handleItemClick(item.href)}
            title={item.label}
          >
            <div className="relative flex flex-col items-center justify-center h-full">
                <IconComponent className="menu-icon" />
                <span className="menu-title">{item.label}</span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
