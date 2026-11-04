'use client';

import { ErrorScreen } from '@/components/error-screen';

export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorScreen
      error={error}
      retry={retry}
      mode="class"
      title="Panel yüklenemedi"
      text="Bir şeyler ters gitti. Verileriniz etkilenmedi; tekrar deneyin, sürerse sayfayı yenileyin."
    />
  );
}
