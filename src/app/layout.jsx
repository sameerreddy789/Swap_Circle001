import './globals.css';
import { Inter } from 'next/font/google';
import LayoutShell from './layout-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'SwapCircle',
  description: 'Swap items with people in your community. A peer-to-peer bartering platform for the modern circular economy.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-500`} suppressHydrationWarning>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
