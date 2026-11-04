'use client';
import { useState } from 'react';

// Ortak "Masadan ayrıl" düğmesi: ilk basışta onay ister, onaylanınca onLeave() çağrılır (genelde send('leave')).
// Diğer oyunlardaki satır içi (sure/setSure) bloğuyla aynı metin ve sınıflar.
export default function LeaveButton({ onLeave, busy, confirmLabel = 'Evet, masadan ayrıl', className = '' }) {
  const [sure, setSure] = useState(false);
  const cls = className ? ` ${className}` : '';
  return sure
    ? <button type="button" className={`btn sm danger${cls}`} disabled={busy} onClick={() => { setSure(false); onLeave(); }}>{confirmLabel}</button>
    : <button type="button" className={`btn sm${cls}`} onClick={() => setSure(true)}>Masadan ayrıl</button>;
}
