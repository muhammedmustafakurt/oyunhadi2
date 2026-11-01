import GameCover from '@/components/oyun/GameCover';
import { SPINE } from '@/lib/spines';

// Masalar arası sohbetin tanıtım görseli: yan masadan gelen istek, kabul ve yazışma (avatarlar oyun karakterleri).
function Av({ id }: { id: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: SPINE[id][0] }}>
      <GameCover id={id} title={false} className="h-10 w-10 overflow-hidden rounded-full" />
    </span>
  );
}

function Msg({ av, who, text, me = false, delay }: { av: string; who: string; text: string; me?: boolean; delay: number }) {
  return (
    <div className={`chat-in flex items-end gap-2.5 ${me ? 'flex-row-reverse' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <Av id={av} />
      <div className={`max-w-[280px] px-3.5 py-2.5 text-[15px] ${me ? 'rounded-[18px_18px_4px_18px] bg-grape text-white' : 'rounded-[18px_18px_18px_4px] bg-[#f3f0fb]'}`}>
        <small className={`block text-xs font-extrabold ${me ? 'text-[#e3d6ff]' : 'text-grape'}`}>{who}</small>
        {text}
      </div>
    </div>
  );
}

export default function TableChat() {
  return (
    <div className="rounded-[28px] border border-[#e3dbf7] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(76,29,149,.45)]" aria-label="Örnek masalar arası sohbet">
      <div className="mb-4 flex items-center gap-2.5 border-b border-[#eee8fb] pb-3.5">
        <Av id="cizim" />
        <div>
          <p className="font-display text-lg leading-tight font-extrabold">Masa 3 ile sohbet</p>
          <p className="text-[13px] text-[#8a80a3]">Hadi Kafe · takma adlı, özel sohbet</p>
        </div>
        <span className="ml-auto h-2.5 w-2.5 animate-pulse rounded-full bg-leaf" />
      </div>
      <div className="grid gap-3">
        <p className="chat-in text-center text-[13px] text-[#8a80a3]" style={{ animationDelay: '100ms' }}>
          <b className="text-ink">Mavi Baykuş 27</b> (Masa 3) sohbet etmek istiyor · Kabul ettiniz
        </p>
        <Msg av="cizim" who="Mavi Baykuş 27 · Masa 3" text="Yan masadasınız, çok eğleniyorsunuz! Biz de katılabilir miyiz?" delay={500} />
        <Msg av="vampir" who="Turuncu Tilki 64 · Masa 7" text="Tabii, gelin! Vampir Köylü oynuyoruz, masada yer var." me delay={1000} />
        <Msg av="cizim" who="Mavi Baykuş 27 · Masa 3" text="Harika, sandalyeleri çekiyoruz, geliyoruz." delay={1400} />
        <Msg av="vampir" who="Turuncu Tilki 64 · Masa 7" text="Karekodu okutup masamızın odasına katılın, biz başlatıyoruz." me delay={1800} />
        <div className="chat-in flex items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-sun p-3" style={{ animationDelay: '2200ms' }}>
          <GameCover id="kimim" title={false} className="h-10 w-10 shrink-0 overflow-hidden rounded-xl" />
          <div>
            <p className="font-display leading-tight font-extrabold">Adınız, numaranız görünmez</p>
            <p className="text-[13px]">Takma adla yazışın · istediğiniz an bitirin ya da engelleyin</p>
          </div>
          <span className="ml-auto rounded-lg bg-ink px-2.5 py-1.5 text-sm font-extrabold tracking-wider text-sun">Özel</span>
        </div>
      </div>
    </div>
  );
}
