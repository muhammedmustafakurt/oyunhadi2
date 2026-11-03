'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { GAMES } from '@/lib/games';

type Pts = [string, number][];
type Opt = { t: string; p: Pts };
type Q = { q: string; o: Opt[] };

const CHARS: Record<string, { title: string; body: string }> = {
  satranc: { title: 'Soğukkanlı Stratejist', body: 'Üç hamle sonrasını düşünürsün, telaşlanmazsın. Masada herkes senin ne yapacağını merak eder, sen ise sessizce kahveni yudumlarsın.' },
  spyfall: { title: 'Şüpheli Dedektif', body: 'Kimin neyi neden söylediğini kaçırmazsın. Gözlerin hep masada, kulakların hep ayrıntıda.' },
  tabu: { title: 'Kelime Cambazı', body: 'Yasaklı kelimeyi söylemeden her şeyi anlatırsın. Masanın enerjisi sensin; sen susunca ortam sessizleşir.' },
  cizim: { title: 'Yaratıcı Çizer', body: 'Üç çizgiyle bir fikri anlatırsın. Kusurlu çizimin bile masada kahkaha getirir ve herkesi güldürürsün.' },
  catan: { title: 'Usta Tüccar', body: 'İnsanları ikna eder, takas teklifini kabul ettirirsin. Uzun bir akşamın en sabırlı oyuncusu sensin.' },
  azul: { title: 'Sakin Usta', body: 'Acelen yok, ayrıntıyla ilgilenirsin. Güzel ve düzenli bir şey yapmak seni mutlu eder.' },
  bil: { title: 'Meraklı Bilge', body: 'Başkasının bilmediği şeyleri bilirsin, hızlı da cevaplarsın. Masanın bilgi yarışmasını sen kazanırsın.' },
  vampir: { title: 'Gece Oyuncusu', body: 'Dram, blöf ve tartışma seni besler. Masanın en inandırıcı konuşmacısı olarak herkesi peşinden sürüklersin.' },
};

const QUESTIONS: Q[] = [
  { q: 'Masaya oturdun. İlk işin ne olur?', o: [
    { t: 'Etrafı ve herkesi bir süzerim', p: [['spyfall', 2], ['vampir', 1], ['satranc', 1]] },
    { t: 'Hemen bir espri patlatırım', p: [['tabu', 2], ['cizim', 1], ['vampir', 1]] },
    { t: 'Rahat bir köşe seçip yerleşirim', p: [['azul', 2], ['bil', 1]] },
    { t: 'Gruba bir plan teklif ederim', p: [['catan', 2], ['bil', 1], ['satranc', 1]] },
  ] },
  { q: 'Arkadaşlarınla tartışma çıktı. Ne yaparsın?', o: [
    { t: 'Sakin kalıp herkesi dinlerim', p: [['satranc', 2], ['azul', 1]] },
    { t: 'Herkesi ikna etmeye çalışırım', p: [['vampir', 2], ['tabu', 1], ['catan', 1]] },
    { t: 'Bir anlaşma teklif ederim', p: [['catan', 2], ['spyfall', 1]] },
    { t: 'Esprili bir şey söyleyip ortamı yumuşatırım', p: [['cizim', 2], ['tabu', 1]] },
  ] },
  { q: 'İdeal oyun ne kadar sürer?', o: [
    { t: 'Beş dakika, hızlıca bitsin', p: [['bil', 2], ['tabu', 1]] },
    { t: 'Yarım saat, tam kıvamında', p: [['spyfall', 1], ['cizim', 1], ['azul', 1], ['tabu', 1]] },
    { t: 'Bir akşam boyunca sürsün', p: [['catan', 2], ['vampir', 1]] },
    { t: 'Süre önemli değil, keyif önemli', p: [['azul', 2], ['satranc', 1]] },
  ] },
  { q: 'Hangi süper gücü seçerdin?', o: [
    { t: 'Kimin yalan söylediğini anlamak', p: [['spyfall', 2], ['vampir', 1]] },
    { t: 'Her zaman bir sonraki hamleyi bilmek', p: [['satranc', 2], ['catan', 1]] },
    { t: 'Her sorunun cevabını bilmek', p: [['bil', 2], ['cizim', 1]] },
    { t: 'Her şeyi kelimelerle anlatabilmek', p: [['tabu', 2], ['cizim', 1]] },
  ] },
  { q: 'Kahven nasıl olsun?', o: [
    { t: 'Sade ve sessiz, yanında bir kitap', p: [['azul', 2], ['satranc', 1]] },
    { t: 'Büyük boy, sohbet bol', p: [['tabu', 2], ['vampir', 1]] },
    { t: 'Ne olursa olsun, yeter ki masa dolu olsun', p: [['vampir', 2], ['spyfall', 1], ['catan', 1]] },
    { t: 'Yanında tatlı, birlikte paylaşalım', p: [['cizim', 2], ['catan', 1]] },
  ] },
  { q: 'Oyunu kaybettin. İlk tepkin?', o: [
    { t: 'Rövanş istiyorum!', p: [['satranc', 2], ['bil', 1]] },
    { t: 'Kimin yalan söylediğini hâlâ çözemedim', p: [['spyfall', 2], ['vampir', 1]] },
    { t: 'Güzeldi, şimdi başka bir şey oynayalım', p: [['cizim', 1], ['azul', 1], ['tabu', 1], ['bil', 1]] },
    { t: 'Takas teklifim neden kabul edilmedi?', p: [['catan', 2], ['azul', 1]] },
  ] },
];

// Tarih tohumlu, tekrarlanabilir karıştırma (mulberry32).
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], r: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const LS = 'oh-gunluk-test';

export default function DailyQuiz() {
  // Sunucu ve ilk istemci çıktısı aynı (sabit sıra); tarih tohumu yalnızca effect içinde uygulanır.
  const [day, setDay] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [solvedToday, setSolvedToday] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const k = dayKey(new Date());
    setDay(k);
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const v = JSON.parse(raw) as { day?: string; id?: string };
        if (v.day === k && v.id && CHARS[v.id]) setSolvedToday(v.id);
      }
    } catch {}
  }, []);

  const quiz = useMemo(() => {
    if (!day) return QUESTIONS.map((q) => ({ ...q, o: q.o.map((x, i) => ({ ...x, i })) }));
    const seed = Number(day.replace(/-/g, ''));
    const r = rng(seed);
    return shuffle(QUESTIONS, r).map((q) => ({ ...q, o: shuffle(q.o.map((x, i) => ({ ...x, i })), r) }));
  }, [day]);

  const pick = (optIdx: number) => {
    const next = [...answers, optIdx];
    if (next.length < quiz.length) {
      setAnswers(next);
      setStep(step + 1);
      return;
    }
    const score: Record<string, number> = {};
    next.forEach((oi, qi) => quiz[qi].o[oi].p.forEach(([id, n]) => { score[id] = (score[id] ?? 0) + n; }));
    const ids = Object.keys(CHARS);
    const best = ids.reduce((a, b) => ((score[b] ?? 0) > (score[a] ?? 0) ? b : a), ids[0]);
    setAnswers(next);
    setDone(best);
    try { localStorage.setItem(LS, JSON.stringify({ day, id: best })); } catch {}
  };

  const restart = () => { setStep(0); setAnswers([]); setDone(null); setMsg(''); };

  const shown = done ?? null;
  const game = shown ? GAMES.find((g) => g.id === shown) : null;

  const share = async () => {
    if (!shown || !game) return;
    const text = `Bugün ben ${CHARS[shown].title} (${game.name}) çıktım! Sen hangi masa oyunusun?`;
    const url = `${window.location.origin}/gunluk-test`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Bugün hangi masa oyunusun?', text, url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setMsg('Metin panoya kopyalandı.');
    } catch {
      setMsg('Kopyalanamadı; metni elle seçip paylaşabilirsin.');
    }
  };

  if (shown && game) {
    const c = CHARS[shown];
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center md:p-10" data-testid="result">
        <p className="text-sm font-bold text-grape">Bugünkü sonucun</p>
        <h2 className="mt-3 text-4xl leading-tight font-black md:text-5xl" style={{ fontFamily: 'var(--font-logo), Georgia, serif', fontStyle: 'italic' }}>{game.name}</h2>
        <p className="mt-2 text-xl font-extrabold">{c.title}</p>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted">{c.body}</p>
        <p className="mt-3 text-sm text-muted">{game.players} kişi · {game.minutes} dk · {game.note}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/oyunlar/${game.id}`} className="btn btn-primary">{game.name} oyununu incele</Link>
          <button type="button" className="btn btn-outline" onClick={share}>Sonucu paylaş</button>
        </div>
        <p className="mt-4 min-h-6 text-sm text-muted" role="status" aria-live="polite">{msg}</p>
        <button type="button" className="mt-2 inline-flex min-h-11 items-center px-3 text-sm font-bold text-grape underline underline-offset-4" onClick={restart}>Testi yeniden çöz</button>
      </div>
    );
  }

  const q = quiz[step];
  return (
    <div className="card mx-auto max-w-2xl p-6 md:p-10">
      {solvedToday && step === 0 && (
        <p className="mb-5 rounded-xl bg-sun/40 px-4 py-3 text-sm font-semibold">
          Bugün bu testi çözmüştün: <strong>{GAMES.find((g) => g.id === solvedToday)?.name}</strong> çıkmıştı. İstersen yine çözebilirsin.
        </p>
      )}
      <div className="flex items-center justify-between text-sm font-bold text-muted">
        <span>Soru {step + 1} / {quiz.length}</span>
        <span aria-hidden="true" className="flex gap-1.5">
          {quiz.map((_, i) => <span key={i} className={`h-2 w-6 rounded-full ${i <= step ? 'bg-grape' : 'bg-sand'}`} />)}
        </span>
      </div>
      <h2 className="mt-5 text-2xl leading-tight font-black md:text-3xl">{q.q}</h2>
      <div className="mt-6 grid gap-3">
        {q.o.map((o, idx) => (
          <button key={o.i} type="button" onClick={() => pick(idx)}className="min-h-12 rounded-2xl border-2 border-line bg-paper px-5 py-3 text-left text-base font-semibold transition hover:border-ink hover:bg-cream focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-grape">
            {o.t}
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Cevapların hiçbir yere gönderilmez; test tamamen tarayıcında çalışır.</p>
    </div>
  );
}
