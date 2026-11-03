import Link from 'next/link';
import PhoneMock from '@/components/site/phone-mock';
import CardFan from '@/components/site/card-fan';
import TableChat from '@/components/site/table-chat';
import { GameSeal } from '@/components/oyun/GameCover';
import { accentOf } from '@/components/oyun/emblems';
import { GAMES } from '@/lib/games';
import Accordion from '@/components/site/accordion';
import Icon, { IconBox } from '@/components/site/icon';
import Cta from '@/components/site/cta';
import { Dice, Pawn, Card, Star } from '@/components/site/props';
import { FAQ, FEATURES, PRICE, SITE_URL, STEPS, VENUE_TYPES } from '@/lib/site';

export const metadata = { alternates: { canonical: '/' } };

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'oyunhadi', url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
    {
      '@type': 'SoftwareApplication',
      name: 'oyunhadi',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
      description: 'Kafe, bar ve restoranlar için karekodla açılan, aynı masadaki arkadaşların birlikte oynadığı tarayıcı oyunları.',
      offers: { '@type': 'Offer', priceCurrency: 'TRY', category: 'Yıllık abonelik' },
    },
  ],
};

const TONES = ['coral', 'grape', 'sky', 'leaf', 'rose', 'sun'] as const;
const DECK = GAMES.filter((g) => g.play);

// Ödül kuralını "olay" hapları gibi anlatan parça (sarı bant)
function Chip({ children, tone }: { children: React.ReactNode; tone: 'sky' | 'coral' | 'leaf' | 'grape' }) {
  const c = { sky: 'text-sky', coral: 'text-coral', leaf: 'text-leaf', grape: 'text-grape' }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-sm font-bold shadow-[0_3px_0_var(--color-ink)] ${c}`}>{children}</span>;
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- Başlık: yeşil çuha ve yelpaze deste ---------- */}
      <section className="felt relative overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-28 pb-16 sm:px-6 md:pt-36 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <div>
            <p className="mb-6 inline-block rounded-full bg-black/25 px-3.5 py-1.5 text-sm font-bold">Kafe · Bar · Restoran · Otel lobisi</p>
            <h1 className="text-5xl leading-[0.98] font-black sm:text-6xl lg:text-[4.2rem]">
              Masaya bir karekod koyun, <span className="text-sun">gerisini oyunhadi halleder.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/90">
              Misafir karekodu okutur, desteden bir oyun çeker; masadaki herkes kendi telefonundan katılır. Tabu, Casus, Vampir Köylü ve daha fazlası, mekânınızın logosu ve renkleriyle. Uygulama yok, üyelik yok.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link className="btn btn-felt" href="/teklif">Bana özel teklif al</Link>
              <Link className="btn btn-ghost" href="/demo/masa-1/oyunlar">Demo masada dene</Link>
            </div>
          </div>
          <CardFan />
        </div>
      </section>

      {/* ---------- Mekân türleri ---------- */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 text-sm font-semibold text-muted sm:px-6">
          <span className="text-ink">Kimler için?</span>
          {VENUE_TYPES.map((t) => <span key={t}>{t}</span>)}
        </div>
      </section>

      {/* ---------- Destedeki oyunlar ---------- */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-black md:text-5xl">Destede {DECK.length} oyun var</h2>
              <p className="mt-3 text-lg text-muted">2 kişilik satrançtan 10 kişilik Vampir Köylü&apos;ye. Yenileri ücretsiz eklenir.</p>
            </div>
            <Link href="/oyunlar" className="btn-sm btn-outline shrink-0">Tüm oyunlar</Link>
          </div>
          <ul className="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-9">
            {DECK.map((g) => (
              <li key={g.id} className="w-36 shrink-0 sm:w-auto">
                {/* Mini oyun kartı: takım renginde çerçeve, krem iç yüz, mühür simge, italik logo */}
                <Link href={`/oyunlar/${g.id}`} className="group block rounded-[14px] border-[2.5px] border-ink p-[5px] shadow-[0_4px_0_var(--color-ink)] transition hover:-translate-y-1" style={{ background: accentOf(g.id) }}>
                  <span className="flex flex-col items-center rounded-lg border-[1.5px] border-ink bg-[#fff7ee] px-2 pt-3 pb-2.5 text-center">
                    <GameSeal id={g.id} className="h-[84px] w-[84px] transition-transform duration-300 group-hover:-rotate-6" />
                    <span className="mt-1.5 flex min-h-[2.1em] items-center text-[15px] leading-[1.05] font-extrabold italic" style={{ fontFamily: 'var(--font-logo), Georgia, serif' }}>{g.name}</span>
                    <span className="mt-1.5 text-[10px] font-extrabold tracking-[.12em] text-ink uppercase">{g.players.replace('-', '–')} oyuncu</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Masa sohbeti ---------- */}
      <section className="bg-[#f1ecff] py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_470px]">
          <div>
            <h2 className="text-4xl leading-[0.98] font-black md:text-6xl">Yan masayla <span className="hl">tanışın,</span> oyuna katılsınlar.</h2>
            <p className="mt-6 max-w-lg text-lg text-muted">Masalar birbirine mesaj atabilir. Takma adla bir sohbet isteği gönderilir, karşı masa kabul ederse özel bir sohbet açılır. Adınız ve numaranız paylaşılmaz; sohbeti istediğiniz an bitirebilir, kişiyi engelleyebilir ya da işletmeye bildirebilirsiniz.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {[['Takma ad', 'adınız ve numaranız görünmez'], ['İstek + kabul', 'karşı masa kabul edince açılır'], ['Kafe kontrolünde', 'panelden açar, kapatır, modu seçer']].map(([n, t]) => (
                <li key={n} className="rounded-2xl bg-white p-4">
                  <p className="font-display text-2xl font-black text-grape">{n}</p>
                  <p className="text-sm text-muted">{t}</p>
                </li>
              ))}
            </ul>
          </div>
          <TableChat />
        </div>
      </section>

      {/* ---------- Üç adım: iskambil kartları ---------- */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-4xl font-black md:text-5xl">Üç adımda masalarınızda</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const [rank, suit, red] = [['A', '♠', false], ['2', '♥', true], ['3', '♣', false]][i] as [string, string, boolean];
              return (
                <li key={s.no} className="play-card min-h-52 px-7 pt-7 pb-14 pl-20" data-aos="zoom-y-out" data-aos-delay={i * 120}>
                  <span className={`rank ${red ? 'text-coral' : 'text-ink'}`} aria-hidden="true">{rank}<i>{suit}</i></span>
                  <span className={`rank br ${red ? 'text-coral' : 'text-ink'}`} aria-hidden="true">{rank}<i>{suit}</i></span>
                  <h3 className="text-2xl font-extrabold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------- Sarı vitrin: kolaylık + ödül kuralı ---------- */}
      <section className="band-sun relative overflow-hidden py-24 md:py-32">
        <Dice className="-top-6 left-[6%] w-28 md:w-40" />
        <Pawn className="bottom-6 left-[3%] hidden w-20 md:block md:w-28" delay="-2s" />
        <Card className="top-10 right-[6%] w-24 md:w-32" delay="-4s" />
        <Star className="right-[16%] bottom-8 hidden w-16 sm:block md:w-24" delay="-1s" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-4xl leading-[1.05] font-black md:text-6xl" data-aos="zoom-y-out">
            Gerçekten <span className="hl">kolay</span><br />masa oyunu
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/75" data-aos="zoom-y-out" data-aos-delay={100}>
            Kurulum yok, cihaz yok, personel eğitimi yok. Ödülü bile tek cümleyle kurarsınız:
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5" data-aos="zoom-y-out" data-aos-delay={200}>
            <span className="text-sm font-bold text-ink/60">Eğer</span>
            <Chip tone="sky">🎲 Masa 5</Chip>
            <span className="text-sm font-semibold text-ink/70">Bil Bakalım&apos;da</span>
            <Chip tone="grape">6.000 puanı geçerse</Chip>
            <span className="text-sm font-bold text-ink/60">o zaman</span>
            <Chip tone="leaf">🎁 Ver</Chip>
            <Chip tone="coral">🍰 1 tatlı ikram</Chip>
          </div>
        </div>
      </section>

      {/* ---------- Özellik satırları ---------- */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div data-aos="zoom-y-out">
            <h2 className="text-4xl leading-[1.02] font-black md:text-6xl">Sizin renginiz,<br /><span className="hl">sizin logonuz</span></h2>
            <p className="mt-6 max-w-md text-lg text-muted">Misafir oyunu oynarken markanızı görür. Panelden logonuzu yükleyin, iki renk seçin; masalardaki ekranlar anında güncellenir.</p>
            <Link href="/ozellikler" className="btn btn-outline mt-8">Bütün özellikler</Link>
          </div>
          <div className="relative flex justify-center gap-6" data-aos="zoom-y-out" data-aos-delay={150}>
            <div className="-rotate-6 scale-90"><PhoneMock color="#7c3aed" accent="#22d3ee" name="Lavanta Bistro" initials="LB" /></div>
            <div className="mt-16 hidden rotate-6 scale-90 sm:block"><PhoneMock color="#0f766e" accent="#fde047" name="Liman Pub" initials="LP" /></div>
          </div>
        </div>

        <div className="mx-auto mt-28 grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1" data-aos="zoom-y-out">
            <div className="card -rotate-2 p-6">
              <div className="mb-5 flex items-center justify-between text-sm"><span className="font-bold">Bu hafta</span><span className="text-muted">Hadi Kafe</span></div>
              <div className="mb-6 grid grid-cols-3 gap-3">
                {([['242', 'oyun', 'bg-coral'], ['828', 'oyuncu', 'bg-grape'], ['37', 'ödül', 'bg-leaf']] as const).map(([n, l, c]) => (
                  <div key={l} className={`rounded-xl p-3 text-white ${c}`}><p className="font-display text-3xl font-black">{n}</p><p className="text-xs opacity-85">{l}</p></div>
                ))}
              </div>
              <div className="flex h-40 items-end gap-2">
                {[18, 22, 25, 31, 47, 58, 41].map((v, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <div className={`w-full rounded-t-lg ${i === 5 ? 'bg-coral' : 'bg-sky'}`} style={{ height: `${(v / 58) * 100}%` }} />
                    <span className="text-[11px] text-muted">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2" data-aos="zoom-y-out" data-aos-delay={150}>
            <h2 className="text-4xl leading-[1.02] font-black md:text-6xl">Hangi masa,<br />hangi oyun, <span className="hl-coral">kaç kişi?</span></h2>
            <p className="mt-6 max-w-md text-lg text-muted">Haftalık oyun sayısı, en sevilen oyunlar, yoğun saatler ve verilen ödüller panelde. Oyunları açıp kapatın, duyuru yayınlayın.</p>
            <Link href="/panel" className="btn btn-outline mt-8">Paneli incele</Link>
          </div>
        </div>
      </section>

      {/* ---------- Özellik kartları: mor bant ---------- */}
      <section className="band-grape relative overflow-hidden py-24 md:py-28">
        <div className="confetti pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-black md:text-5xl">Tek karekod, tek panel,<br /><span className="text-sun">tek abonelik</span></h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.slice(0, 6).map((f, i) => (
              <article key={f.title} className="card card-hover p-7 text-ink" data-aos="zoom-y-out" data-aos-delay={(i % 3) * 100}>
                <IconBox name={f.icon} tone={TONES[i % TONES.length]} />
                <h3 className="mt-5 text-xl font-extrabold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Fiyat şeridi ---------- */}
      <section className="pb-24 md:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="band-coral relative overflow-hidden rounded-[2rem] p-10 md:p-14" data-aos="zoom-y-out">
            <div className="grid-lines-light pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-4xl font-black md:text-5xl">Tek paket, her şey dahil</h2>
                <p className="mt-4 max-w-xl text-lg text-white/90">Yıllık <strong className="text-white">{PRICE.yearly}</strong> {PRICE.note}. Tüm oyunlar, pleksiler, panel ve ödül kodları pakete dahil.</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {PRICE.perks.map((p) => <li key={p} className="flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold"><Icon name="check" className="fill-sun" /> {p}</li>)}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/teklif" className="btn btn-white">Teklif al</Link>
                <Link href="/fiyat" className="btn btn-ghost">Fiyat ayrıntıları</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- SSS ---------- */}
      <section className="pb-24 md:pb-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-4xl font-black md:text-5xl">Sıkça sorulanlar</h2>
          <div className="space-y-3">
            {FAQ.slice(0, 6).map((f, i) => <Accordion key={f.q} title={f.q} active={i === 0}>{f.a}</Accordion>)}
          </div>
          <p className="mt-8 text-center"><Link href="/sss" className="font-bold text-grape hover:underline">Tüm sorular →</Link></p>
        </div>
      </section>

      <Cta />
    </>
  );
}
