'use client';

import { ErrorScreen } from '@/components/error-screen';

// Kök layout'ta oluşan hataları yakalar; kendi <html>/<body> belgesini çizer ve uygulamanın stillerini içermez.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0 }}>
        <ErrorScreen
          error={error}
          retry={retry}
          title="Beklenmeyen bir sorun oluştu"
          text="Sayfa yüklenemedi. Tekrar deneyin; sürerse biraz sonra yeniden açın."
        />
      </body>
    </html>
  );
}
