import { type ReactNode } from 'react';
import { Header } from '@/components/Header';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout wrapper with header and content area
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header />
      <main id="main-content" className="w-full px-4 py-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 h-[calc(100vh-7.1rem)]">
        {children}
      </main>
    </div>
  );
}
