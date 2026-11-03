import { NextResponse, type NextRequest } from 'next/server';

// Host'a göre yönlendirme. admin.oyunhadi.com (ADMIN_HOST) tüm yolları /yonetim altına yeniden yazar ve yalnızca
// yönetim sayfalarını/API'sini sunar; ana alanda /yonetim ve /api/yonetim 404 verir.
// (admin.ts yerine burada ayrı tutuldu: proxy ortak modül/global durumuna güvenmemeli.)
const ADMIN_HOST = (process.env.ADMIN_HOST || 'admin.oyunhadi.com').trim().toLowerCase().replace(/:\d+$/, '');
const DEV = process.env.NODE_ENV !== 'production';
const HEADERS = { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Cache-Control': 'no-store' };

const notFound = (extra: Record<string, string> = {}) => new NextResponse('Not found', { status: 404, headers: { ...HEADERS, ...extra } });
const under = (p: string, base: string) => p === base || p.startsWith(`${base}/`);

export function proxy(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
  const path = req.nextUrl.pathname;
  const isAdmin = host === ADMIN_HOST || (DEV && host === 'admin.localhost');

  if (!isAdmin) {
    if (under(path, '/yonetim') || under(path, '/api/yonetim')) return notFound();
    return NextResponse.next();
  }

  if (path === '/robots.txt') {
    return new NextResponse('User-agent: *\nDisallow: /\n', { headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  if (under(path, '/api/yonetim') || path.startsWith('/_next/')) {
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(HEADERS)) res.headers.set(k, v);
    return res;
  }
  // Admin host'ta ana site, oyun, panel ve diğer API'ler yok; /yonetim yolunu doğrudan yazmak da geçersiz.
  if (under(path, '/yonetim') || under(path, '/api')) return notFound();

  const url = req.nextUrl.clone();
  url.pathname = path === '/' ? '/yonetim' : `/yonetim${path}`;
  return NextResponse.rewrite(url, { headers: HEADERS });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
