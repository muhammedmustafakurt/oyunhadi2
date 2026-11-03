import PageContainer from '@/components/panel/page-container';
import VenueCreateForm from '@/components/admin/venue-create-form';
import { requireAdminPage } from '@/lib/admin';
import { GAMES } from '@/lib/games';
import { VENUE_GAMES } from '@/lib/venues';

export const metadata = { title: 'Yeni mekân' };
export const dynamic = 'force-dynamic';

export default async function NewVenuePage() {
  await requireAdminPage();
  const games = VENUE_GAMES.map((id: string) => ({ id, name: GAMES.find((g) => g.id === id)?.name ?? id }));
  return (
    <PageContainer title="Yeni mekân" description="Mekânı oluşturun; mekân sahibinin başlangıç şifresi bir kez gösterilir.">
      <VenueCreateForm games={games} />
    </PageContainer>
  );
}
