import PageContainer from '@/components/panel/page-container';
import LocationCard from '@/components/panel/location-card';
import SettingsSave from '@/components/panel/settings-save';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { requireVenue } from '@/lib/venues';

export const metadata = { title: 'Ayarlar' };
export const dynamic = 'force-dynamic';

// Panel kullanıcıları henüz ayrı bir tabloda değil; yalnızca hesap sahibi listelenir.
const USERS = [
  { name: 'Mekân sahibi', role: 'Sahip' },
];

export default async function SettingsPage() {
  const v = await requireVenue();
  return (
    <PageContainer title="Ayarlar" description="Mekân bilgileri, konum kilidi ve panel kullanıcıları.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Mekân bilgileri</CardTitle></CardHeader>
          <SettingsSave name={v.name} city={v.city} slug={v.slug} />
        </Card>
        <Card>
          <CardHeader><CardTitle>Konum</CardTitle><CardDescription>Karekodun fotoğrafını çekip evden oynanmasını önler.</CardDescription></CardHeader>
          <CardContent><LocationCard lat={v.lat} lng={v.lng} /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Panel kullanıcıları</CardTitle>
          <CardDescription>Girişte kullanılan hesap: {v.email || 'belirlenmedi'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {USERS.map((u, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <Avatar><AvatarFallback>{v.initials || 'MK'}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="font-medium">{u.name}</p><p className="text-muted-foreground truncate text-sm">{v.email || '—'}</p></div>
                <Badge variant="outline">{u.role}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
