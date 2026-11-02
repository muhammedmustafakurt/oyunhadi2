import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Fraunces } from 'next/font/google';
import '@/styles/oyun.css';
import '@/styles/oyuncu.css';
import '@/styles/oyun-deste.css';
import '@/styles/sohbet.css';

// Oyuncu ekranı: masadaki karekod/NFC ile açılan mobil sayfalar. Site ve panelden ayrı kök layout (stiller karışmaz).
const font = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font', display: 'swap' });
const logo = Fraunces({ subsets: ['latin', 'latin-ext'], style: ['italic'], variable: '--font-logo', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'oyunhadi', template: '%s · oyunhadi' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ff4f2e' };

export default function PlayerRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${font.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
