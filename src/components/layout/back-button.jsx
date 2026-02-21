
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // This check ensures window is defined, and runs only on the client
    setHasHistory(window.history.length > 2);
  }, [pathname]);
  
  if (!hasMounted) {
      return null;
  }

  // Don't render the button on the homepage
  if (pathname === '/') {
    return null;
  }

  const handleClick = () => {
    if (hasHistory) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative z-20">
      <InteractiveHoverButton
        text="Back"
        onClick={handleClick}
        aria-label="Go back to previous page"
      />
    </div>
  );
}
