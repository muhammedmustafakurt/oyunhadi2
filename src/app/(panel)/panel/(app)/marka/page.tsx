import PageContainer from '@/components/panel/page-container';
import BrandEditor from '@/components/panel/brand-editor';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Marka ve renkler' };
export const dynamic = 'force-dynamic';

export default async function BrandPage() {
  const v = await requireVenue();
  return (
    <PageContainer title="Marka ve renkler" description="Oyun ekranı mekânınızın logosu ve renkleriyle açılır.">
      <BrandEditor venue={{ name: v.name, initials: v.initials, color: v.color, accent: v.accent, welcome: v.welcome, coverUrl: v.coverUrl, coverTitle: v.coverTitle, themeId: v.themeId }} />
    </PageContainer>
  );
}
