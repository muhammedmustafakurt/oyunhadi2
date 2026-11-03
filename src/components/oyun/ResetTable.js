'use client';
import { useState } from 'react';
import { getPid } from '@/components/games/useRoom';

// Masadakiler kalkıp gitmiş ama oyun açık kalmışsa, odayı silip lobiyi sıfırdan kurar. Herkes (izleyici dahi) kullanabilir.
export default function ResetTable({ cafe, masa, game, event = /** @type {string | undefined} */ (undefined) }) {
  const [step, setStep] = useState('idle'); // idle | ask | busy
  const [err, setErr] = useState('');

  async function wipe() {
    setStep('busy');
    setErr('');
    try {
      const r = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe, masa, game, event, pid: getPid(), action: { type: 'wipe' } }),
      });
      if (!r.ok) throw new Error();
      window.location.reload();
    } catch {
      setErr('Masa sıfırlanamadı, tekrar deneyin.');
      setStep('ask');
    }
  }

  return (
    <aside className="rt">
      <p>Masadakiler kalkıp gitti ama oyun açık mı kaldı?</p>
      {step === 'idle' ? (
        <button className="btn sm" onClick={() => setStep('ask')}>Masayı sıfırdan kur</button>
      ) : (
        <div className="rt-ask" role="alert">
          <p>Bu masadaki oyun ve oyuncular silinecek. Emin misin?</p>
          <div>
            <button className="btn sm danger" disabled={step === 'busy'} onClick={wipe}>Evet, sıfırla</button>
            <button className="btn sm" disabled={step === 'busy'} onClick={() => setStep('idle')}>Vazgeç</button>
          </div>
        </div>
      )}
      {err && <p className="mono-err" role="alert">{err}</p>}
    </aside>
  );
}
