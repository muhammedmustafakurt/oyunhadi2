import Link from 'next/link';
import { IconScan } from '@tabler/icons-react';
import PageContainer from '@/components/panel/page-container';
import StatCard from '@/components/panel/stat-card';
import RewardsManager, { type RuleRow } from '@/components/panel/rewards-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { requireVenue } from '@/lib/venues';
import { listRules, recentCodes, rewardStats } from '@/lib/rewards';
import { REWARD_GAME_IDS } from '@/lib/reward-games';
import { GAMES } from '@/lib/games';
import { gameName } from '@/lib/game-meta';

export const metadata = { title: 'Ödüller' };
export const dynamic = 'force-dynamic';

const STATUS = { bekliyor: 'Bekliyor', kullanildi: 'Kullanıldı', 'suresi-doldu': 'Süresi doldu' } as const;
const when = (ms: number) => new Date(ms).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });

export default async function RewardsPage() {
  const v = await requireVenue();
  const [rules, codes, st] = await Promise.all([listRules(v.id), recentCodes(v.id, 20), rewardStats(v.id)]);
  const ruleRows: RuleRow[] = rules.map((r) => ({ ...r, gameName: gameName(r.game) }));
  const games = GAMES.filter((g) => REWARD_GAME_IDS.includes(g.id) && v.games.includes(g.id)).map((g) => ({ id: g.id, name: g.name }));
  const allNames = GAMES.filter((g) => g.play && !REWARD_GAME_IDS.includes(g.id)).map((g) => g.name).join(', ');
  return (
    <PageContainer
      title="Ödüller"
      description="Hedef puanı geçen oyuncuya, oyun bitince tek kullanımlık kod çıkar. Kod 4 saat geçerlidir, garson buradan doğrular."
      action={<Link href="/panel/oduller/dogrula" className={buttonVariants()}><IconScan /> Kod doğrula</Link>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Bu ay verilen" value={String(st.issued)} change={st.changePct} note="Geçen aya göre" />
        <StatCard label="Kullanılan" value={String(st.used)} note={st.usedPct == null ? 'Bu ay henüz kod verilmedi' : `%${st.usedPct} kullanım oranı`} />
        <StatCard
          label="Tahmini maliyet"
          value={st.costTry == null ? '—' : `₺${st.costTry.toLocaleString('tr-TR')}`}
          note={st.costTry == null ? 'Kurala ikram maliyeti girerseniz hesaplanır' : `Kullanılan ${st.costedCount} kodun ikram maliyeti`}
        />
      </div>

      <RewardsManager rules={ruleRows} games={games} allNames={allNames} />

      <Card>
        <CardHeader><CardTitle>Son verilen kodlar</CardTitle></CardHeader>
        <CardContent className="px-0 sm:px-6">
          {codes.length === 0 ? (
            <p className="text-muted-foreground px-6 text-sm sm:px-0">Henüz kod verilmedi. Hedefi geçen oyuncu için oyun bitince otomatik oluşur.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Kod</TableHead><TableHead>Masa</TableHead><TableHead className="hidden sm:table-cell">Oyun</TableHead><TableHead className="hidden md:table-cell">Ödül</TableHead><TableHead>Durum</TableHead><TableHead className="hidden text-right sm:table-cell">Zaman</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((r) => (
                  <TableRow key={r.code}>
                    <TableCell><code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{r.code}</code></TableCell>
                    <TableCell>Masa {r.masa.replace('masa-', '')}</TableCell>
                    <TableCell className="hidden sm:table-cell">{gameName(r.game)}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.prize}</TableCell>
                    <TableCell><Badge variant={r.status === 'bekliyor' ? 'default' : r.status === 'kullanildi' ? 'secondary' : 'outline'}>{STATUS[r.status]}</Badge></TableCell>
                    <TableCell className="text-muted-foreground hidden text-right sm:table-cell">{when(r.issuedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
