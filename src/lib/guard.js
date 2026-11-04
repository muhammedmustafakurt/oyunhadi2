// Ortak istek korumaları: CSRF için Origin denetimi ve JSON gövde boyut sınırı (süper-admin, panel ve oyuncu uçları kullanır).

// CSRF: durum değiştiren (GET/HEAD/OPTIONS dışı) isteklerde Origin başlığı varsa sitenin kendi Host'uyla aynı olmalı;
// başlık yoksa tarayıcının Sec-Fetch-Site: same-origin bildirmesi gerekir.
export function originOk(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.get('origin');
  if (origin) {
    try { return new URL(origin).host.toLowerCase() === String(req.headers.get('host') ?? '').toLowerCase(); } catch { return false; }
  }
  return req.headers.get('sec-fetch-site') === 'same-origin';
}

// Gövdeyi en çok `max` bayt okuyup JSON'a çevirir. Content-Length ve gerçek okuma ayrı ayrı denetlenir (başlık yalan
// söyleyebilir / chunked olabilir). Dönüş: { body } ya da { status: 400 | 413 }.
export async function readBody(req, max = 64 * 1024) {
  const len = Number(req.headers.get('content-length'));
  if (Number.isFinite(len) && len > max) return { status: 413 };
  let text = '';
  try {
    if (!req.body) return { status: 400 };
    const reader = req.body.getReader();
    const dec = new TextDecoder();
    let n = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      n += value.byteLength;
      if (n > max) { reader.cancel().catch(() => {}); return { status: 413 }; }
      text += dec.decode(value, { stream: true });
    }
    text += dec.decode();
    return { body: JSON.parse(text) };
  } catch {
    return { status: 400 };
  }
}

export const BODY_ERRORS = { 400: 'Geçersiz istek.', 413: 'İstek çok büyük.' };
