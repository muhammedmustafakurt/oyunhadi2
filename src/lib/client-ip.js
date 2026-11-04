// İstemci adresi seçimi (SAF: içe aktarma yok, Node ile doğrudan test edilir). ratelimit.js clientIp bunu çağırır.
// TEK güvenilir yardımcı: panel girişi, admin, room, chat, event hep ratelimit.clientIp üzerinden bunu kullanır.
// Güven modeli başlıkların KİM tarafından yazıldığına bağlıdır:
//  - Vercel (VERCEL ortam değişkeni dolu): edge, x-forwarded-for'u istemcinin gönderdiğiyle değil kendi gördüğü
//    gerçek adresle ezer; x-real-ip ve x-vercel-forwarded-for de edge tarafından yazılır. Sıra: x-real-ip,
//    x-vercel-forwarded-for, XFF ilk girdisi. (Bu davranış Vercel belgelerine dayanır; node_modules içindeki Next
//    belgelerinde geçmediği için yerelde doğrulanamadı.)
//  - Vercel dışı üretim (kendi sunucu/proxy): istemci XFF'ye girdi ekleyebilir; ilk girdi SAHTEDİR. En yakın
//    proxy'nin eklediği SON girdi (ya da x-real-ip) kullanılır. Proxy yoksa da sahte ilk girdiye güvenilmez.
//  - Geliştirme: ilk XFF girdisi (testlerin IP ayrımını simüle edebilmesi için).
// Yine de kritik işlemlerde IP'den bağımsız (masa/mekân bazlı) ikinci bir sınır uygulanır.
/**
 * @param {(name: string) => string | null} get başlık okuyucu (küçük harfli ad)
 * @param {{ vercel: boolean, prod: boolean }} env
 */
export function pickClientIp(get, { vercel, prod }) {
  const xff = (get('x-forwarded-for') ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  let ip;
  if (vercel) ip = get('x-real-ip') || get('x-vercel-forwarded-for') || xff[0];
  else if (prod) ip = get('x-real-ip') || xff[xff.length - 1];
  else ip = xff[0] || get('x-real-ip');
  return String(ip ?? '').trim().slice(0, 64) || 'unknown';
}
