'use client';

import { IconDots, IconExternalLink } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Masa satırının işlem menüsü (şimdilik yalnızca oyuncu ekranını açar).
export default function TableActions({ label, url }: { label: string; url: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${label} işlemleri`} />}>
        <IconDots />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<a href={url} target="_blank" rel="noopener noreferrer" />}><IconExternalLink /> Oyuncu ekranını aç</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
