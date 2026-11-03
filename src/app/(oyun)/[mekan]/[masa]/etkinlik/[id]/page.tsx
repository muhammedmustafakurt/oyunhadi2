import Link from 'next/link';
import { notFound } from 'next/navigation';
import BilOnline from '@/components/games/BilOnline';
import ResetTable from '@/components/oyun/ResetTable';
import Presence from '@/components/oyun/Presence';
import VenueBadge from '@/components/oyun/VenueBadge';
import { findCafe, hasTable } from '@/lib/rooms';
import EventGame from '@/components/games/EventGame';
import { getEvent } from '@/lib/events';
import { MASS } from '@/lib/event-kinds';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Etkinlik' };

// Mekân etkinliği (ve varsa Mekân Sınavı). Yalnızca durumu 'acik' olan etkinlikte oyun görünür; kapalıysa
// "Henüz açılmadı", bittiyse "sona erdi" sayfası gösterilir. Asıl kapı /api/room içinde de sunucuda uygulanır.
export default async function EventPage({ params }: PageProps<'/[mekan]/[masa]/etkinlik/[id]'>) {
  const { mekan, masa, id } = await params;
  const v = await findCafe(mekan);
  if (!v || !hasTable(v, masa) || !/^\d{1,10}$/.test(id)) notFound();
  const ev = await getEvent(Number(id));
  if (!ev || ev.bizId !== v.id) notFound();
  const back = `/${mekan}/${masa}/oyunlar`;
  const open = ev.status === 'acik';
  const mass = MASS.includes(ev.kind);
  // Toplu oyunda bitmiş etkinliğin sonuç ekranı (kazananlar) da gösterilir; yazma işlemleri sunucuda yine reddedilir.
  const show = open || (mass && ev.status === 'bitti');

  return (
    <main className="oh-play">
      <header className="oh-play-top">
        <Link href={back} className="oh-back" aria-label="Tüm oyunlar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <VenueBadge venue={v} />
        <span className="oh-play-where">{v.name}<small>Masa {masa.replace('masa-', '')}</small></span>
      </header>
      <div className="shell oh-play-body">
        {show ? (
          <>
            <section className="ev-head">
              <h1>{ev.title}</h1>
              {ev.body && <p>{ev.body}</p>}
            </section>
            {mass ? (
              <EventGame cafe={mekan} masa={masa} event={String(ev.id)} kind={ev.kind} />
            ) : ev.questions > 0 ? (
              <>
                <BilOnline cafe={mekan} masa={masa} event={String(ev.id)} />
                <Presence cafe={mekan} masa={masa} game="bil" event={String(ev.id)} />
                <ResetTable cafe={mekan} masa={masa} game="bil" event={String(ev.id)} />
              </>
            ) : (
              <p className="mono-where">Bu etkinlik için masada oynanacak bir oyun yok; mekânın duyurularını takip edin.</p>
            )}
          </>
        ) : (
          <section className="ev-head" role="status">
            <h1>{ev.status === 'bitti' ? 'Etkinlik sona erdi' : 'Henüz açılmadı'}</h1>
            <p>{ev.status === 'bitti' ? 'Bu etkinlik tamamlandı.' : 'Etkinlik mekân tarafından açıldığında buradan katılabilirsiniz.'}</p>
          </section>
        )}
        <p className="oh-play-back"><Link href={back}>← Tüm oyunlar</Link></p>
      </div>
    </main>
  );
}
