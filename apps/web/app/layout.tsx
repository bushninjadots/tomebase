import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TomeBase — Your knowledge base',
    template: '%s — TomeBase',
  },
  description:
    'Documentation platform for modern engineering teams. Auto-generate API docs, collaborate with your team, and publish beautiful documentation.',
  openGraph: {
    title: 'TomeBase — Your knowledge base',
    description:
      'Documentation platform for modern engineering teams. Auto-generate API docs, collaborate, and publish.',
    type: 'website',
    siteName: 'TomeBase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TomeBase — Your knowledge base',
    description:
      'Documentation platform for modern engineering teams.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
    </html>
  );
}
