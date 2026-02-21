
import Link from "next/link";
import { Repeat } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-popover border-t border-border">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="logo-wrap flex items-center gap-3">
              <div className="glass-circle !w-9 !h-9">
                  <svg className="arrows !w-5 !h-5" viewBox="0 0 24 24">
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
              <div className="logo-text !text-base !font-semibold">SwapCircle</div>
          </Link>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SwapCircle. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-popover-foreground">Contact</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-popover-foreground">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-popover-foreground">Privacy Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
