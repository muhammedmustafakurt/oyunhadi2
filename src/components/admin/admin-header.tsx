'use client';

import Header from '@/components/panel/header';
import { ADMIN_TITLES } from './nav';

// Panelin Header bileşeni, yönetim başlıklarıyla (sunucu → istemci sınırında fonksiyon geçmemek için burada bağlanır).
export default function AdminHeader() {
  return <Header section="Yönetim" titles={ADMIN_TITLES} bell={false} />;
}
