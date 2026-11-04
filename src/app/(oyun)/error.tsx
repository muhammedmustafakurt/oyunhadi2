'use client';

import { ErrorScreen } from '@/components/error-screen';

export default function PlayerError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorScreen
      error={error}
      retry={retry}
      title="Masada bir aksilik çıktı"
      text="Sayfa açılamadı. Oyununuz sunucuda duruyor; tekrar denemek genelde yeter."
    />
  );
}
