'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast';
import { AIProviderProvider } from '@/components/ai/ai-provider-context';
import { SpiritProvider } from '@/components/spirit/spirit-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <AIProviderProvider>
            <SpiritProvider>
              {children}
            </SpiritProvider>
          </AIProviderProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
