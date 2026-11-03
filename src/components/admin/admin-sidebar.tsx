'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconChevronsDown, IconLogout, IconShieldLock, IconKey } from '@tabler/icons-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ADMIN_NAV_GROUPS } from './nav';

// Yönetim kenar menüsü: mekân panelinin AppSidebar'ıyla aynı iskelet ve ui/sidebar bileşenleri.
export default function AdminSidebar({ email }: { email: string }) {
  const path = usePathname();
  const router = useRouter();
  // Özet ve "Yeni mekân" tam eşleşir (Mekânlar, /admin/mekanlar/yeni altında da etkin görünmesin).
  const isActive = (url: string) => (url === '/admin' || url === '/admin/mekanlar/yeni' ? path === url : path === url || (path.startsWith(`${url}/`) && path !== '/admin/mekanlar/yeni'));

  const out = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.push('/admin/giris');
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <span className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconShieldLock className="size-4" />
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Yönetim</span>
                <span className="text-muted-foreground truncate text-xs">oyunhadi platformu</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {ADMIN_NAV_GROUPS.map((group) => (
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground" />}>
                <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg">{(email[0] ?? 'Y').toLocaleUpperCase('tr')}</AvatarFallback></Avatar>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Yönetici</span>
                  <span className="text-muted-foreground truncate text-xs">{email}</span>
                </span>
                <IconChevronsDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--anchor-width) min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">Platform yöneticisi</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/admin/yoneticiler" />}><IconKey className="mr-2 h-4 w-4" /> Şifremi değiştir</DropdownMenuItem>
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
