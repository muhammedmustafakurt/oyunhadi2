'use client';

import { useEffect, useRef, useState } from 'react';

// Mekânın kapak bandı (oyunlar sayfası, çuha üstü). Görsel dekoratiftir (alt=""); başlık ayrı gerçek metindir ve
// mekân renginin üstünde --on-brand ile okunur. Görsel yüklenmezse (404, engel) band mekân rengiyle kalır.
export default function CoverBand({ url, title }: { url: string | null; title: string | null }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // Hata, sayfa canlanmadan önce oluştuysa onError kaçabilir: yüklenmiş ama boş görseli de başarısız say.
  useEffect(() => { const el = img.current; if (el && el.complete && el.naturalWidth === 0) setFailed(true); }, []);
  const showImg = !!url && !failed;
  if (!showImg && !title) return null;
  return (
    <figure className={`felt-cover${showImg ? '' : ' no-img'}`}>
      {showImg && (
        <div className="felt-cover-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={img} src={url!} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setFailed(true)} />
        </div>
      )}
      {title && <figcaption>{title}</figcaption>}
    </figure>
  );
}
