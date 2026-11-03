import { notFound } from 'next/navigation';
import PageContainer from '@/components/panel/page-container';
import VenueEditor from '@/components/admin/venue-editor';
import SubscriptionEditor from '@/components/admin/subscription-editor';
import { requireAdminPage, venueDetail } from '@/lib/admin';
import { GAMES } from '@/lib/games';
import { VENUE_GAMES } from '@/lib/venues';
import { getSubscription, listPayments, dayStr } from '@/lib/subscriptions';

export const metadata = { title: 'Mekân' };
export const dynamic = 'force-dynamic';

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const v = await venueDetail(Number(id));
  if (!v) notFound();
  const [sub, pays] = await Promise.all([getSubscription(v.id), listPayments(v.id)]);
  const games = VENUE_GAMES.map((g: string) => ({ id: g, name: GAMES.find((x) => x.id === g)?.name ?? g }));
  return (
    <PageContainer title={v.name} description={`Adres: ${v.slug}`}>
      <div className="grid gap-6">
        <VenueEditor venue={{ id: v.id, name: v.name, city: v.city, email: v.email, tables: v.tables, games: v.games }} games={games} />
        <SubscriptionEditor
          venueId={v.id}
          today={dayStr(Date.now())}
          initial={sub && { plan: sub.plan, status: sub.rawStatus, start: dayStr(sub.startedAt), end: dayStr(sub.endsAt), totalTry: sub.totalTry == null ? '' : String(sub.totalTry), vatNote: sub.vatNote, method: sub.method, renewal: sub.renewal }}
          payments={pays.map((p) => ({ id: p.id, date: dayStr(p.paidAt), description: p.description, amountTry: p.amountTry, status: p.status }))}
        />
      </div>
    </PageContainer>
  );
}
