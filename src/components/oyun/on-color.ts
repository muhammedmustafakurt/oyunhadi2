// Mekân renginin üstüne yazı koyarken okunur kalacak rengi seçer (WCAG 2.x göreli parlaklık).
// Saf fonksiyonlar: sunucuda (mekân layout'u) ve testlerde aynı şekilde çalışır.

export const ON_DARK = '#0b1033'; // açık zeminde yazı (koyu lacivert mürekkep)
export const ON_LIGHT = '#ffffff'; // koyu zeminde yazı

/** "#rrggbb" biçiminde HEX'in göreli parlaklığı (0 = siyah, 1 = beyaz). Geçersiz girdide null. */
export function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** İki HEX renk arasındaki WCAG kontrast oranı (1-21). Geçersiz girdide null. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Beyaz yazı için en düşük kontrast. 3:1 = WCAG AA kalın/büyük metin; düğme ve başlıklar kalın olduğundan marka mercanı (#ff4f2e, 3.28:1) beyaz kalır. */
export const MIN_CONTRAST = 3;

/** Zemin rengi üstünde yazı rengi: beyaz MIN_CONTRAST'ı sağlıyorsa beyaz (marka hissi), yoksa daha yüksek kontrastlı olan. */
export function onColor(bg: string): string {
  const dark = contrastRatio(bg, ON_DARK);
  const light = contrastRatio(bg, ON_LIGHT);
  if (dark == null || light == null) return ON_LIGHT;
  if (light >= MIN_CONTRAST) return ON_LIGHT;
  return dark > light ? ON_DARK : ON_LIGHT;
}
