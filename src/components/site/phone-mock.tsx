import GameCover from '@/components/oyun/GameCover';
import { SPINE } from '@/lib/spines';

const ROWS = [
  { id: 'tabu', name: 'Tabu', meta: '4–10 kişi' },
  { id: 'bil', name: 'Bil Bakalım', meta: '2–10 kişi' },
  { id: 'cizim', name: 'Çiz Bakalım', meta: '3–10 kişi' },
];

// Ana sayfadaki telefon: masada açılan oyuncu ekranının küçük bir kopyası (görsel; tıklanmaz).
export default function PhoneMock({ color = '#ff4f2e', accent = '#ffc83d', name = 'Hadi Kafe', initials = 'HK' }) {
  return (
    <div className="relative mx-auto w-[260px] rounded-[2rem] border-[3px] border-ink bg-gray-900 p-2.5 shadow-[6px_6px_0_var(--color-ink)]" aria-hidden="true">
      <div className="absolute left-1/2 top-3.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-gray-900" />
      <div className="overflow-hidden rounded-[2.1rem] bg-[#fff7ee]">
        <div className="relative overflow-hidden rounded-b-3xl border-b-2 border-gray-900 px-4 pt-9 pb-5 text-white" style={{ background: color }}>
          <svg className="absolute -right-3 top-6 h-14 w-14 rotate-12" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill={accent} /><circle cx="13" cy="13" r="4" fill={color} /><circle cx="27" cy="27" r="4" fill={color} /></svg>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-gray-900 bg-white text-[11px] font-extrabold" style={{ color }}>{initials}</span>
            <span className="text-[13px] font-bold leading-tight">{name}</span>
          </div>
          <span className="mt-4 inline-block -rotate-3 rounded-full border-2 border-gray-900 px-2.5 py-0.5 text-[11px] font-extrabold text-gray-900" style={{ background: accent }}>Masa 5</span>
          <p className="mt-2 text-[22px] font-extrabold leading-[0.95] tracking-tight">Hadi, bir oyun seçin!</p>
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-xl border-2 border-gray-900 px-3 py-2 text-[11px] text-gray-900" style={{ background: accent }}>
            <span className="rounded-full bg-gray-900 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider" style={{ color: accent }}>Ödüllü oyun</span>
            <p className="mt-1 font-bold leading-tight">6.000 puanı geç, tatlı bizden!</p>
          </div>
          {ROWS.map((r) => {
            const [bg, fg] = SPINE[r.id];
            return (
              <div key={r.id} className="relative flex h-[58px] items-center overflow-hidden rounded-xl border-2 border-gray-900 px-3" style={{ background: bg, color: fg }}>
                <div>
                  <p className="text-[14px] font-extrabold leading-none">{r.name}</p>
                  <p className="mt-1 text-[10px] font-semibold opacity-85">{r.meta}</p>
                </div>
                <GameCover id={r.id} title={false} className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 overflow-hidden rounded-lg" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
