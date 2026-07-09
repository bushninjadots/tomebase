import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Fluid — Knowledge that flows into action',
    template: '%s — Fluid',
  },
  description:
    'Documentation platform for modern engineering teams. Auto-generate API docs, collaborate with your team, and publish beautiful documentation.',
  openGraph: {
    title: 'Fluid — Knowledge that flows into action',
    description:
      'Documentation platform for modern engineering teams. Auto-generate API docs, collaborate, and publish.',
    type: 'website',
    siteName: 'Fluid',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluid — Knowledge that flows into action',
    description:
      'Documentation platform for modern engineering teams.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
