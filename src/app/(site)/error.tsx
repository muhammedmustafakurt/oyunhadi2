'use client';

import { ErrorScreen } from '@/components/error-screen';

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorScreen
      error={error}
      retry={retry}
      title="Bu sayfa şu an açılamadı"
      text="Geçici bir sorun olabilir. Tekrar deneyin ya da ana sayfaya dönün."
      home={{ href: '/', label: 'Ana sayfaya dön' }}
    />
  );
}
