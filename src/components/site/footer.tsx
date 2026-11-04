import Link from 'next/link';
import Logo from './logo';
import { whatsappLink } from '@/lib/site';

const COLS = [
  { title: 'Ürün', links: [['/ozellikler', 'Özellikler'], ['/nasil-calisir', 'Nasıl çalışır'], ['/oyunlar', 'Oyunlar'], ['/fiyat', 'Fiyat'], ['/cozumler', 'Mekân çözümleri'], ['/kurumsal', 'Kurumsal ve zincirler'], ['/kampus', 'Kampüs']] },
  { title: 'Kaynaklar', links: [['/sss', 'Sıkça sorulan sorular'], ['/blog', 'Blog'], ['/kafe-oyunlari-rehberi', 'Kafe oyunları rehberi'], ['/yarisma-gecesi', 'Yarışma gecesi'], ['/oyuncular-icin', 'Oyuncular için'], ['/gunluk-test', 'Günlük test'], ['/guven', 'Güven ve veri'], ['/ortaklik', 'Ortaklık programları'], ['/demo/masa-1/oyunlar', 'Demo masa'], ['/panel/giris', 'Mekân girişi']] },
  { title: 'Yasal', links: [['/yasal/kvkk', 'KVKK aydınlatma metni'], ['/yasal/gizlilik', 'Gizlilik politikası'], ['/yasal/cerezler', 'Çerez politikası'], ['/yasal/kullanim-sartlari', 'Kullanım şartları'], ['/yasal/mesafeli-satis', 'Mesafeli satış sözleşmesi'], ['/yasal/abonelik-sozlesmesi', 'Abonelik sözleşmesi'], ['/yasal/iade', 'Teslimat ve iade']] },
] as const;

// Alt bilgi: kum renginde zemin, üstte oyun renklerinden ince şerit.
export default function Footer() {
  return (
    <footer className="relative bg-sand">
      <div className="flex h-2" aria-hidden="true">
        {['#ff4f2e', '#ffc83d', '#1f9d6b', '#12a3bf', '#7c3aed', '#e0457f'].map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-14 sm:grid-cols-12">
          <div className="space-y-4 sm:col-span-12 lg:col-span-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted">Kafe, bar ve restoranlar için karekodla açılan, masada birlikte oynanan oyunlar.</p>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-sm btn-outline">WhatsApp&apos;tan yazın</a>
          </div>
          {COLS.map((c) => (
            <div key={c.title} className="space-y-3 sm:col-span-4 lg:col-span-2">
              <h3 className="font-sans text-sm font-bold tracking-normal">{c.title}</h3>
              <ul className="space-y-2 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link className="text-muted transition hover:text-ink" href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3 sm:col-span-4 lg:col-span-2">
            <h3 className="font-sans text-sm font-bold tracking-normal">İletişim</h3>
            <ul className="space-y-2 text-sm">
              <li><a className="text-muted transition hover:text-ink" href="mailto:merhaba@oyunhadi.com">merhaba@oyunhadi.com</a></li>
              <li><Link className="text-muted transition hover:text-ink" href="/teklif">Teklif formu</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-[3px] border-ink py-6 text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} oyunhadi. Tüm hakları saklıdır.</p>
          <p>Masada oynamayı sevenler için yapıldı.</p>
        </div>
      </div>
    </footer>
  );
}
