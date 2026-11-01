import { ICONS } from '@/lib/game-icons';

// Çizgi ikon (rengi çevresindeki metin rengidir). İçerik projedeki sabit dosyadan gelir.
export default function Icon({ name, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}
