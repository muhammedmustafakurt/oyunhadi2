import type { MetadataRoute } from 'next';
import { GAMES } from '@/lib/games';
import { POSTS } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/ozellikler', '/nasil-calisir', '/oyunlar', '/fiyat', '/sss', '/blog', '/teklif', '/cozumler', '/kurumsal', '/kampus', '/kafe-oyunlari-rehberi', '/yarisma-gecesi', '/guven', '/oyuncular-icin', '/gunluk-test', '/ortaklik', '/yasal'];
  const tips = ['kafe', 'bar-pub', 'restoran', 'otel-lobisi', 'nargile-salonu', 'kampus-kafesi', 'tatlici', 'bowling-eglence'];
  const legal = ['kvkk', 'gizlilik', 'cerezler', 'kullanim-sartlari', 'mesafeli-satis', 'abonelik-sozlesmesi', 'iade'];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.8 })),
    ...tips.map((t) => ({ url: `${SITE_URL}/cozumler/${t}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...legal.map((t) => ({ url: `${SITE_URL}/yasal/${t}`, changeFrequency: 'yearly' as const, priority: 0.3 })),
    ...GAMES.filter((g) => g.play).map((g) => ({ url: `${SITE_URL}/oyunlar/${g.id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
