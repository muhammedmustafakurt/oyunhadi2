'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

// Panel grafikleri (starter'daki overview grafiklerinin oyunhadi verisine uyarlanmış hâli).

const weekCfg = {
  oyun: { label: 'Oyun', color: 'var(--chart-1)' },
  oyuncu: { label: 'Oyuncu', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function WeekChart({ data }: { data: { day: string; oyun: number; oyuncu: number }[] }) {
  return (
    <ChartContainer config={weekCfg} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillOyun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-oyun)" stopOpacity={0.75} />
            <stop offset="95%" stopColor="var(--color-oyun)" stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="fillOyuncu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-oyuncu)" stopOpacity={0.75} />
            <stop offset="95%" stopColor="var(--color-oyuncu)" stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--foreground)" strokeOpacity={0.2} strokeDasharray="4 4" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Area dataKey="oyuncu" type="monotone" fill="url(#fillOyuncu)" stroke="var(--foreground)" strokeWidth={2} />
        <Area dataKey="oyun" type="monotone" fill="url(#fillOyun)" stroke="var(--foreground)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
}

export function GameBarChart({ data }: { data: { name: string; oyun: number; color: string }[] }) {
  const cfg = { oyun: { label: 'Oyun', color: 'var(--chart-1)' } } satisfies ChartConfig;
  return (
    <ChartContainer config={cfg} className="aspect-auto h-[300px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--foreground)" strokeOpacity={0.2} strokeDasharray="4 4" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="oyun" radius={[0,4,4,0]} stroke="var(--foreground)" strokeWidth={2}>
          {data.map((d) => <Cell key={d.name} fill={d.color} stroke="var(--foreground)" strokeWidth={2} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function SimpleBarChart({ data, x, y, label }: { data: Record<string, string | number>[]; x: string; y: string; label: string }) {
  const cfg = { [y]: { label, color: 'var(--chart-1)' } } satisfies ChartConfig;
  return (
    <ChartContainer config={cfg} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--foreground)" strokeOpacity={0.2} strokeDasharray="4 4" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey={y} fill={`var(--color-${y})`} radius={[4,4,0,0]} stroke="var(--foreground)" strokeWidth={2} />
      </BarChart>
    </ChartContainer>
  );
}
