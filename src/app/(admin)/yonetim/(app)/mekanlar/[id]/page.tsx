import { notFound } from 'next/navigation';
import PageContainer from '@/components/panel/page-container';
import VenueEditor from '@/components/admin/venue-editor';
import { requireAdminPage, venueDetail } from '@/lib/admin';
import { GAMES } from '@/lib/games';
import { VENUE_GAMES } from '@/lib/venues';

export const metadata = { title: 'Mekân' };
export const dynamic = 'force-dynamic';

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const v = await venueDetail(Number(id));
  if (!v) notFound();
  const games = VENUE_GAMES.map((g: string) => ({ id: g, name: GAMES.find((x) => x.id === g)?.name ?? g }));
  return (
    <PageContainer title={v.name} description={`Adres: ${v.slug}`}>
      <VenueEditor venue={{ id: v.id, name: v.name, city: v.city, email: v.email, tables: v.tables, games: v.games }} games={games} />
    </PageContainer>
  );
}
