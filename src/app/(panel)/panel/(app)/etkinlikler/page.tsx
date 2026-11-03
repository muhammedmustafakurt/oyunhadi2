import PageContainer from '@/components/panel/page-container';
import EventsManager, { type EventRow } from '@/components/panel/events-manager';
import { requireVenue } from '@/lib/venues';
import { listEvents } from '@/lib/events';

export const metadata = { title: 'Etkinlikler' };
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const v = await requireVenue();
  const events = (await listEvents(v.id)) as EventRow[];
  return (
    <PageContainer title="Etkinlikler" description="Etkinlik ve Mekân Sınavı oluşturun. Yalnızca “Açık” etkinlikler masalarda görünür ve girilebilir; açmayı, kapatmayı ve bitirmeyi siz yaparsınız.">
      <EventsManager events={events} />
    </PageContainer>
  );
}
