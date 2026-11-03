import {
  IconLayoutDashboard,
  IconTable,
  IconDeviceGamepad2,
  IconGift,
  IconChartBar,
  IconSpeakerphone,
  IconCalendarEvent,
  IconMessages,
  IconPalette,
  IconCreditCard,
  IconSettings,
} from '@tabler/icons-react';

// Panel menüsü: kenar çubuğu ve sayfa başlıkları buradan beslenir.
export const NAV_GROUPS = [
  {
    label: 'Mekân',
    items: [
      { title: 'Genel bakış', url: '/panel', icon: IconLayoutDashboard },
      { title: 'Masalar ve karekodlar', url: '/panel/masalar', icon: IconTable },
      { title: 'Oyunlar', url: '/panel/oyunlar', icon: IconDeviceGamepad2 },
      { title: 'Ödüller', url: '/panel/oduller', icon: IconGift },
      { title: 'İstatistikler', url: '/panel/istatistik', icon: IconChartBar },
      { title: 'Duyurular', url: '/panel/duyurular', icon: IconSpeakerphone },
      { title: 'Etkinlikler', url: '/panel/etkinlikler', icon: IconCalendarEvent },
      { title: 'Sosyal Sohbet', url: '/panel/sohbet', icon: IconMessages },
    ],
  },
  {
    label: 'Hesap',
    items: [
      { title: 'Marka ve renkler', url: '/panel/marka', icon: IconPalette },
      { title: 'Abonelik', url: '/panel/abonelik', icon: IconCreditCard },
      { title: 'Ayarlar', url: '/panel/ayarlar', icon: IconSettings },
    ],
  },
];

export const titleOf = (path: string) => {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const exact = all.find((i) => i.url === path);
  if (exact) return exact.title;
  const parent = all.filter((i) => i.url !== '/panel').find((i) => path.startsWith(i.url));
  return parent?.title ?? 'Panel';
};
