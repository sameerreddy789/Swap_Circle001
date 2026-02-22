'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Home, Search, PlusCircle, Package, MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const iconMap = {
    Home,
    Search,
    PlusCircle,
    Package,
    MessageSquare,
};

const defaultItems = [
    { label: 'Home', icon: 'Home', href: '/' },
    { label: 'Browse', icon: 'Search', href: '/items' },
    { label: 'List', icon: 'PlusCircle', href: '/items/new' },
    { label: 'My Items', icon: 'Package', href: '/my-items' },
    { label: 'Inbox', icon: 'MessageSquare', href: '/inbox' },
];

const InteractiveMenu = ({ items }) => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const finalItems = useMemo(() => defaultItems, []);

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

  return (
    <nav className="menu" role="navigation">
      {finalItems.map((item, index) => {
        const isRouteActive = index === activeIndex;
        const IconComponent = iconMap[item.icon] || Home;
        return (
          <Link
            key={item.label}
            href={item.href}
            prefetch={true}
            className={cn('menu-item', { 'route-active': isRouteActive })}
            title={item.label}
          >
            <div className="relative flex flex-col items-center justify-center h-full">
                <IconComponent className="menu-icon" />
                <span className="menu-title">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export { InteractiveMenu };
