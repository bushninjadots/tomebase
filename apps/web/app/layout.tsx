import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TomeBase — Developer documentation platform',
    template: '%s — TomeBase',
  },
  description:
    'Write once, publish anywhere. The fastest way to publish beautiful developer documentation.',
  openGraph: {
    title: 'TomeBase — Developer documentation platform',
    description:
      'Write once, publish anywhere. Markdown-powered docs with wiki links, version history, and public hosting.',
    type: 'website',
    siteName: 'TomeBase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TomeBase — Developer documentation platform',
    description:
      'Write once, publish anywhere. Markdown-powered docs with wiki links, version history, and public hosting.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} dark`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-theme-page font-sans text-theme-main antialiased">
          <Providers>
            {children}
          </Providers>
        </body>
    </html>
  );
}
