import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/panel.css';
import ThemeProvider from '@/components/panel/theme-provider';
import { Toaster } from '@/components/ui/sonner';

// Süper-admin paneli (admin.oyunhadi.com). Arama motorlarına kapalı; proxy ayrıca X-Robots-Tag verir.
const sans = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-geist' });
const mono = Geist_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: { default: 'Yönetim', template: '%s · oyunhadi yönetim' },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: '#000000' };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} bg-background overflow-x-hidden font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
