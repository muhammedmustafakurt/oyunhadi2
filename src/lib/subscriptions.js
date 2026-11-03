// Mekân abonelikleri ve ödemeleri (subscriptions / payments tabloları, şema db.js'te). Ödeme entegrasyonu henüz yok:
// kayıtlar yalnızca süper-admin panelinden (src/lib/admin.js üzerinden bu işlevlerle) girilir; mekân paneli yalnızca okur.
import { get, all, run } from './db';

export const SUB_STATUSES = ['aktif', 'deneme', 'bitti', 'iptal'];
export const RENEWALS = ['elle', 'otomatik'];
export const PAY_STATUSES = ['odendi', 'bekliyor', 'iade'];
const DAY = 24 * 60 * 60 * 1000;
const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, max);

// 'YYYY-MM-DD' (Türkiye saati) -> ms. end=true gün sonunu verir.
function dayMs(s, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''))) return NaN;
  return Date.parse(`${s}T${end ? '23:59:59' : '00:00:00'}+03:00`);
}
export const dayStr = (ms) => new Date(Number(ms) + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const int = (v, max) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : NaN;
};

function shape(r, now = Date.now()) {
  const start = Number(r.started_at), end = Number(r.ends_at);
  // Bitiş tarihi geçmişse aktif/deneme kaydı 'bitti' görünür (mekân kısıtlanmaz, yalnızca rozet).
  const status = (r.status === 'aktif' || r.status === 'deneme') && end < now ? 'bitti' : r.status;
  const span = Math.max(1, end - start);
  return {
    plan: r.plan, status, rawStatus: r.status, startedAt: start, endsAt: end,
    daysLeft: Math.max(0, Math.ceil((end - now) / DAY)),
    usedPct: Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100))),
    totalTry: r.total_try == null ? null : Number(r.total_try),
    vatNote: r.vat_note, method: r.method, renewal: r.renewal,
  };
}

/** @returns {Promise<{ plan: string, status: string, rawStatus: string, startedAt: number, endsAt: number, daysLeft: number, usedPct: number, totalTry: number | null, vatNote: string, method: string, renewal: string } | null>} */
export async function getSubscription(bizId) {
  const r = await get('SELECT * FROM subscriptions WHERE biz_id = ?', bizId);
  return r ? shape(r) : null;
}

/** @returns {Promise<{ id: number, paidAt: number, description: string, amountTry: number, status: string, invoiceUrl: string | null }[]>} */
export async function listPayments(bizId) {
  return (await all('SELECT id, paid_at, description, amount_try, status, invoice_url FROM payments WHERE biz_id = ? ORDER BY paid_at DESC, id DESC LIMIT 200', bizId)).map((p) => ({
    id: p.id, paidAt: Number(p.paid_at), description: p.description, amountTry: Number(p.amount_try), status: p.status, invoiceUrl: p.invoice_url || null,
  }));
}

// Süper-admin: kaydı oluşturur ya da günceller. raw: { plan, status, start, end, totalTry, vatNote, method, renewal }.
export async function saveSubscription(bizId, raw) {
  const plan = clean(raw?.plan, 60);
  if (!plan) return { error: 'Paket adı gerekli.' };
  if (!SUB_STATUSES.includes(raw?.status)) return { error: 'Geçersiz durum.' };
  const renewal = RENEWALS.includes(raw?.renewal) ? raw.renewal : 'elle';
  const start = dayMs(raw?.start), end = dayMs(raw?.end, true);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { error: 'Başlangıç ve bitiş tarihi gerekli.' };
  if (end <= start) return { error: 'Bitiş tarihi başlangıçtan sonra olmalı.' };
  const total = int(raw?.totalTry, 100_000_000);
  if (Number.isNaN(total)) return { error: 'Tutar geçersiz.' };
  const now = Date.now();
  await run(
    `INSERT INTO subscriptions (biz_id, plan, status, started_at, ends_at, total_try, vat_note, method, renewal, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (biz_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, started_at = EXCLUDED.started_at, ends_at = EXCLUDED.ends_at,
       total_try = EXCLUDED.total_try, vat_note = EXCLUDED.vat_note, method = EXCLUDED.method, renewal = EXCLUDED.renewal, updated_at = EXCLUDED.updated_at`,
    bizId, plan, raw.status, start, end, total, clean(raw?.vatNote, 30), clean(raw?.method, 80), renewal, now,
  );
  return { subscription: await getSubscription(bizId) };
}

export async function addPayment(bizId, raw) {
  const paidAt = dayMs(raw?.date);
  if (!Number.isFinite(paidAt)) return { error: 'Ödeme tarihi gerekli.' };
  const amount = int(raw?.amountTry, 100_000_000);
  if (amount == null || Number.isNaN(amount)) return { error: 'Tutar geçersiz.' };
  if (!PAY_STATUSES.includes(raw?.status)) return { error: 'Geçersiz ödeme durumu.' };
  const url = String(raw?.invoiceUrl ?? '').trim();
  if (url && !/^https:\/\/[^\s"'<>()\\]{1,300}$/.test(url)) return { error: 'Fatura bağlantısı https:// ile başlamalı.' };
  const n = Number((await get('SELECT count(*)::int AS n FROM payments WHERE biz_id = ?', bizId))?.n) || 0;
  if (n >= 200) return { error: 'En çok 200 ödeme kaydı tutulur.' };
  await run('INSERT INTO payments (biz_id, paid_at, description, amount_try, status, invoice_url) VALUES (?, ?, ?, ?, ?, ?)',
    bizId, paidAt, clean(raw?.description, 100), amount, raw.status, url || null);
  return { ok: true };
}

export async function deletePayment(bizId, id) {
  if (!Number.isInteger(id) || id < 1) return { error: 'Geçersiz ödeme.' };
  const r = await get('DELETE FROM payments WHERE id = ? AND biz_id = ? RETURNING id', id, bizId);
  return r ? { ok: true } : { error: 'Ödeme bulunamadı.', status: 404 };
}
