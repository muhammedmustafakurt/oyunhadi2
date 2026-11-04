'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { onColor } from '@/components/oyun/on-color';
import { IconChevronsDown, IconExternalLink, IconLogout, IconUser, IconCreditCard } from '@tabler/icons-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NAV_GROUPS } from './nav';
import type { Venue } from '@/lib/venue-types';

// Panel kenar menüsü: mekân bilgisi oturumdan (venues tablosundan) gelir.
export default function AppSidebar({ venue: v }: { venue: Venue }) {
  const path = usePathname();
  const router = useRouter();
  const isActive = (url: string) => (url === '/panel' ? path === url : path.startsWith(url));

  const out = async () => {
    await fetch('/api/panel/logout', { method: 'POST' });
    router.push('/panel/giris');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/panel" />}>
              <span className="flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: v.color, color: onColor(v.color) }}>
                {v.initials}
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{v.name}</span>
                <span className="text-muted-foreground truncate text-xs">{v.city}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="py-0">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton render={<Link href={item.url} />} tooltip={item.title} isActive={isActive(item.url)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
        <SidebarGroup className="mt-auto py-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<a href={`/${v.slug}/masa-1/oyunlar`} target="_blank" rel="noopener noreferrer" />} tooltip="Oyuncu ekranını aç">
                <IconExternalLink />
                <span>Oyuncu ekranını aç</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground" />}>
                <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg">{v.initials}</AvatarFallback></Avatar>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{v.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{v.email || 'mekân sahibi'}</span>
                </span>
                <IconChevronsDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--anchor-width) min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">Mekân sahibi</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/panel/ayarlar" />}><IconUser className="mr-2 h-4 w-4" /> Hesabım</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/panel/abonelik" />}><IconCreditCard className="mr-2 h-4 w-4" /> Abonelik</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={out}><IconLogout className="mr-2 h-4 w-4" /> Çıkış yap</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
