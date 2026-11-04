'use client';

import { useEffect } from 'react';

// Hata (error.tsx / global-error.tsx) ve yükleniyor (loading.tsx) ekranlarının ortak görünümü.
// Kök layout'lar ayrı stil dosyaları yüklediği için stil kendi içinde taşınır; paylaşılan CSS'e dokunulmaz.
// Neobrütalist dil: krem zemin, mürekkep kenarlık, sert gölge, mercan düğme. Koyu tema:
// mode='media' sistem renk şemasını (oyuncu/site/global), mode='class' panelin .dark sınıfını izler.
export type ScreenMode = 'media' | 'class';

const CSS = `
.eh-scr{--eh-bg:#fff8f0;--eh-card:#fff;--eh-ink:#1c1233;--eh-muted:#5a4f72;--eh-coral:#ff4f2e;--eh-coral-ink:#1c1233;--eh-shadow:#1c1233;
  min-height:100svh;display:grid;place-items:center;padding:24px 16px;background:var(--eh-bg);color:var(--eh-ink);font-family:var(--font,var(--font-geist,system-ui)),system-ui,sans-serif;text-align:center}
.eh-scr.eh-fit{min-height:60svh;background:transparent}
.eh-card{width:100%;max-width:420px;padding:28px 22px;background:var(--eh-card);border:3px solid var(--eh-ink);border-radius:18px;box-shadow:6px 6px 0 var(--eh-shadow)}
.eh-mark{display:inline-grid;place-items:center;width:56px;height:56px;margin-bottom:14px;border:3px solid var(--eh-ink);border-radius:14px;background:var(--eh-coral);color:var(--eh-coral-ink);font-size:30px;font-weight:800;line-height:1}
.eh-card h1{margin:0 0 8px;font-size:1.4rem;line-height:1.2;font-weight:800;color:var(--eh-ink)}
.eh-card p{margin:0 0 20px;color:var(--eh-muted);font-size:.98rem;line-height:1.5}
.eh-btn{appearance:none;cursor:pointer;min-height:48px;padding:12px 24px;font:inherit;font-weight:800;color:var(--eh-coral-ink);background:var(--eh-coral);border:3px solid var(--eh-ink);border-radius:14px;box-shadow:4px 4px 0 var(--eh-shadow);transition:transform .08s,box-shadow .08s}
.eh-btn:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--eh-shadow)}
.eh-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--eh-shadow)}
.eh-btn:focus-visible{outline:3px solid #7c3aed;outline-offset:3px}
.eh-link{display:inline-block;margin-top:14px;color:var(--eh-muted);font-size:.9rem;text-decoration:underline}
.eh-dots{display:inline-flex;gap:8px;margin-bottom:14px}
.eh-dots i{width:14px;height:14px;border:3px solid var(--eh-ink);border-radius:50%;background:var(--eh-coral);animation:eh-bounce 1s infinite ease-in-out}
.eh-dots i:nth-child(2){animation-delay:.15s;background:#ffc83d}
.eh-dots i:nth-child(3){animation-delay:.3s;background:#7c3aed}
@keyframes eh-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}
@media (prefers-reduced-motion:reduce){.eh-dots i{animation:none}.eh-btn{transition:none}}
`;
const DARK = '--eh-bg:#0c0f26;--eh-card:#151a3d;--eh-ink:#f1f2fb;--eh-muted:#b4b9dd;--eh-coral:#ff6a4d;--eh-coral-ink:#1c1233;--eh-shadow:#000';
const MEDIA = `@media (prefers-color-scheme:dark){.eh-scr.eh-media{${DARK}}}`;
const CLASS = `.dark .eh-scr.eh-class{${DARK}}`;

function Styles({ mode }: { mode: ScreenMode }) {
  return <style>{CSS + (mode === 'class' ? CLASS : MEDIA)}</style>;
}

export function ErrorScreen({ error, retry, title, text, mode = 'media', fit, home }: {
  error?: unknown; retry: () => void; title: string; text: string; mode?: ScreenMode; fit?: boolean; home?: { href: string; label: string };
}) {
  useEffect(() => { if (error) console.error(error); }, [error]);
  return (
    <main className={`eh-scr eh-${mode}${fit ? ' eh-fit' : ''}`}>
      <Styles mode={mode} />
      <div className="eh-card" role="alert">
        <div className="eh-mark" aria-hidden="true">!</div>
        <h1>{title}</h1>
        <p>{text}</p>
        <button type="button" className="eh-btn" onClick={() => retry()}>Tekrar dene</button>
        {home && <div><a className="eh-link" href={home.href}>{home.label}</a></div>}
      </div>
    </main>
  );
}

export function LoadingScreen({ label, mode = 'media', fit }: { label: string; mode?: ScreenMode; fit?: boolean }) {
  return (
    <main className={`eh-scr eh-${mode}${fit ? ' eh-fit' : ''}`} role="status" aria-live="polite" aria-busy="true">
      <Styles mode={mode} />
      <div>
        <div className="eh-dots" aria-hidden="true"><i /><i /><i /></div>
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--eh-muted)' }}>{label}</p>
      </div>
    </main>
  );
}
