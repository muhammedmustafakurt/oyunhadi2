import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, Onest } from 'next/font/google';
import '@/styles/site.css';
import Header from '@/components/site/header';
import Footer from '@/components/site/footer';
import WhatsAppButton from '@/components/site/whatsapp-button';
import AosInit from '@/components/site/aos-init';
import { SITE_URL } from '@/lib/site';

// Tanıtım ve satış sitesi. Düzen gdevelop.io'dan esinlendi; renkler açık ve canlı.
const body = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-body', display: 'swap' });
const head = Onest({ subsets: ['latin', 'latin-ext'], weight: ['700', '800', '900'], variable: '--font-head', display: 'swap' });
const logo = Fraunces({ subsets: ['latin', 'latin-ext'], style: ['italic'], variable: '--font-logo', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'oyunhadi · Kafe ve restoranlar için karekodlu masa oyunları', template: '%s · oyunhadi' },
  description: 'Misafirleriniz masadaki karekodu okutsun, uygulama indirmeden arkadaşlarıyla birlikte oynasın. Tabu, Casus, Vampir Köylü ve daha fazlası; mekânınızın logosu ve renkleriyle.',
  applicationName: 'oyunhadi',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'oyunhadi', url: '/' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#fff8f0' };

export default function SiteRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${body.variable} ${head.variable} ${logo.variable} scroll-smooth`}>
      <body className="bg-cream font-sans text-ink antialiased">
        <AosInit />
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          <Header />
          <main className="grow">{children}</main>
          <Footer />
        </div>
        <WhatsAppButton />
      </body>
    </html>
  );
}
