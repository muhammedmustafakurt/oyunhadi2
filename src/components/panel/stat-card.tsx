import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Starter'daki özet kartı: değer, değişim rozeti, alt not.
export default function StatCard({ label, value, change, note }: { label: string; value: string; change?: number; note: string }) {
  const up = (change ?? 0) >= 0;
  return (
    <Card className="@container/card shadow-md">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-black tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        {change !== undefined && (
          <CardAction>
            <Badge variant="outline">
              {up ? <IconTrendingUp /> : <IconTrendingDown />}
              {up ? '+' : ''}{change}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="text-muted-foreground text-sm">{note}</CardFooter>
    </Card>
  );
}
