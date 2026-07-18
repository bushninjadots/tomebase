'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast';
import { SpiritProvider } from '@/components/spirit/spirit-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <SpiritProvider>
            {children}
          </SpiritProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
