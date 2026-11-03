import { IconLayoutDashboard, IconBuildingStore, IconPlus, IconShieldLock } from '@tabler/icons-react';

// Yönetim menüsü: kenar çubuğu ve üst bar başlıkları buradan beslenir (panelin nav.ts yapısıyla aynı).
export const ADMIN_NAV_GROUPS = [
  {
    label: 'Platform',
    items: [
      { title: 'Özet', url: '/admin', icon: IconLayoutDashboard },
      { title: 'Mekânlar', url: '/admin/mekanlar', icon: IconBuildingStore },
      { title: 'Yeni mekân', url: '/admin/mekanlar/yeni', icon: IconPlus },
      { title: 'Yöneticiler', url: '/admin/yoneticiler', icon: IconShieldLock },
    ],
  },
];

export const ADMIN_TITLES = ADMIN_NAV_GROUPS.flatMap((g) => g.items.map(({ url, title }) => ({ url, title })));
