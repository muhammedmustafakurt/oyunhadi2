'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { IconMoon, IconSun, IconBell } from '@tabler/icons-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { titleOf } from './nav';

type Title = { url: string; title: string };

// Starter'daki üst bar: menü düğmesi, sayfa adı, tema düğmesi.
// Varsayılan: mekân paneli. Süper-admin `section`, `titles` (ve bell={false}) ile aynı bileşeni kullanır.
export default function Header({ section = 'Panel', titles, bell = true }: { section?: string; titles?: Title[]; bell?: boolean }) {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const title = titles
    ? (titles.find((i) => i.url === path) ?? titles.filter((i) => path.startsWith(`${i.url}/`)).sort((a, b) => b.url.length - a.url.length)[0])?.title ?? section
    : titleOf(path);
  return (
    <header className="no-print bg-background border-foreground sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b-2 md:h-14">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 data-vertical:self-center" />
        <span className="text-muted-foreground text-sm">{section}</span>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-extrabold">{title}</span>
      </div>
      <div className="flex items-center gap-1 px-4">
        {bell && <Button variant="ghost" size="icon" aria-label="Bildirimler"><IconBell /></Button>}
        <Button variant="ghost" size="icon" aria-label="Temayı değiştir" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          <IconSun className="hidden dark:block" />
          <IconMoon className="dark:hidden" />
        </Button>
      </div>
    </header>
  );
}
