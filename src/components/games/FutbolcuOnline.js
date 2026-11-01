'use client';
import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import Icon from './Icon';
import { PALETTE } from '@/lib/emlak';
import { WIN_POINTS } from '@/lib/futbolcu';

function Avatar({ i, name }) {
  return <i className="fb-av" style={{ background: PALETTE[i % PALETTE.length] }}>{(name || '?').trim().charAt(0).toUpperCase()}</i>;
}

// Futbolcuyu Bul: tutan oyuncu futbolcunun adını yazar (yalnızca tutana gösterilir), diğerleri masada sözlü soru sorar.
// Tahmin yazılır, oyun karşılaştırır (büyük/küçük harf, boşluk ve Türkçe karakter farkı sayılmaz). Sesli iletişim yoktur.
export default function FutbolcuOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'futbolcu' });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);
  const [secret, setSecret] = useState('');
  const [guess, setGuess] = useState('');
  const g = room?.game;
  const round = g?.round;
  useEffect(() => { setSecret(''); setGuess(''); }, [round]);

  if (!room) return <p className="mono-where">{err || 'Masa açılıyor…'}</p>;

  if (room.phase === 'lobby') {
    return (
      <Lobby
        masaNo={masa.replace('masa-', '')} room={room} ui={ui} max={10} min={2}
        seatNote={(k) => (k === 0 ? 'masayı açan' : '')}
      />
    );
  }

  const names = room.seats.map((s) => s.name);
  const seated = room.me >= 0 && !room.seats[room.me]?.left;
  const me = seated ? g.me : null;
  const isHolder = !!me?.holder;
  const myTurn = !!me?.turn;
  const over = g.over;
  const ph = g.phase;
  const holderName = names[g.holder];
  const turnName = names[g.turn];
  const ended = over?.kind === 'end';
  const ranking = room.seats.map((s, i) => ({ i, s, pts: g.scores[i] ?? 0 })).sort((a, b) => b.pts - a.pts || a.i - b.i);
  const top = ranking[0]?.pts ?? 0;
  const lastWrong = g.guessLog.filter((x) => !x.ok);
  const guessing = ph === 'ask' && myTurn;
  const nameOf = (i) => (i === room.me ? 'Sen' : names[i]);

  return (
    <div className="fb">
      {!seated && <p className="mono-where">Tur başladı; izleyici olarak takip ediyorsunuz.</p>}

      <section className={`fb-pitch ph-${ph}`}>
        <div className="fb-lines" aria-hidden="true"><i className="c" /><i className="m" /></div>
        <header className="fb-head">
          <b>Tur {g.round}</b>
          <span className="fb-role"><Icon name="ball-football" />{isHolder ? 'Futbolcuyu sen tutuyorsun' : `Tutan: ${holderName}`}</span>
        </header>

        <div className="fb-stats" aria-label="Tur sayaçları">
          <div><b>{g.questions}</b><small>Soru</small></div>
          <div><b>{g.guesses}</b><small>Tahmin</small></div>
          <div className="y"><b>{g.yes}</b><small>Evet</small></div>
          <div className="n"><b>{g.no}</b><small>Hayır</small></div>
        </div>

        {isHolder && g.secret && ph !== 'over' && <p className="fb-secret"><Icon name="brain" />Tuttuğun futbolcu: <b>{g.secret}</b></p>}
        {g.note && <p className="fb-note">{g.note}</p>}

        {/* ---- Aşama kartı ---- */}
        {ph === 'hold' && (
          <div className="fb-card">
            {isHolder ? (
              <>
                <Icon name="brain" className="fb-ic" />
                <h2>Aklından bir futbolcu tut</h2>
                <p>Aktif ya da emekli, dünyanın herhangi bir ligi veya milli takımından olabilir. Adını aşağıya yaz; yalnızca sen görürsün, tahminleri oyun kontrol eder.</p>
                <form className="fb-form" onSubmit={(e) => { e.preventDefault(); send('fbready', { name: secret }); }}>
                  <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Futbolcunun adı (ör. Arda Turan)" maxLength={60} autoComplete="off" required />
                  <button className="btn primary fb-big" disabled={busy || secret.trim().length < 2}>Tuttum</button>
                </form>
                <p className="fb-warn">Futbolcuyu sonradan değiştiremezsin. Sorulara dürüstçe cevap ver.</p>
              </>
            ) : (
              <>
                <Icon name="ball-football" className="fb-ic" />
                <h2>{holderName} futbolcu tutuyor</h2>
                <p>Hazır olunca soru sırası başlayacak. Soruları masada sesli sorarsınız.</p>
              </>
            )}
          </div>
        )}

        {ph === 'ask' && (
          <div className="fb-card">
            <small className="fb-k">SIRA</small>
            <h2><Avatar i={g.turn} name={turnName} />{myTurn ? 'Sıra sende' : turnName}</h2>
            {myTurn ? (
              <>
                <p>Masada sesli bir soru sor, sonra düğmeye bas. Bildiğini düşünüyorsan adı yazıp tahmin et; büyük/küçük harf ve boşluk fark etmez.</p>
                <button className="btn primary fb-big" disabled={busy} onClick={() => send('fbask')}>Soruyu sordum</button>
                <form className="fb-form" onSubmit={(e) => { e.preventDefault(); send('fbguess', { word: guess }); }}>
                  <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Tahminin: futbolcunun adı" maxLength={60} autoComplete="off" aria-label="Tahmin" />
                  <button className="btn fb-big alt" disabled={busy || guess.trim().length < 2}>Tahmin et</button>
                </form>
              </>
            ) : isHolder ? (
              <p>{turnName} soru soracak. Sorusunu duyunca bekle, o &quot;sordum&quot; deyince EVET ya da HAYIR de.</p>
            ) : (
              <p>{turnName} soru sormak ya da tahmin etmek üzere. Sıran gelince düğmeler açılır.</p>
            )}
          </div>
        )}

        {ph === 'answer' && (
          <div className="fb-card">
            <small className="fb-k">SORU {g.questions + 1}</small>
            <h2><Avatar i={g.turn} name={turnName} />{myTurn ? 'Sorunu sordun' : `${turnName} sordu`}</h2>
            {isHolder ? (
              <>
                <p>Sorulan soruya dürüstçe cevap ver.</p>
                <div className="fb-yn">
                  <button className="fb-yes" disabled={busy} onClick={() => send('fbanswer', { yes: true })}><Icon name="check" />EVET</button>
                  <button className="fb-no" disabled={busy} onClick={() => send('fbanswer', { yes: false })}><Icon name="x" />HAYIR</button>
                </div>
              </>
            ) : (
              <p>{holderName} cevaplıyor…</p>
            )}
          </div>
        )}

        {ph === 'over' && (
          <div className="fb-card fb-over" role="status">
            <Icon name={ended ? 'flag' : 'trophy'} className="fb-ic" />
            <h2>{over.text}</h2>
            {!ended && (
              <p>
                Futbolcu: <b>{over.answer}</b>. <b>{g.questions}</b> soru sorundu, <b>{g.guesses}</b> tahmin yapıldı.
                {' '}<b>{names[over.winner]}</b> +{WIN_POINTS} puan aldı.
              </p>
            )}
            {!ended && seated && (
              <button className="btn primary fb-big" disabled={busy} onClick={() => send('fbnext')}>Yeni tur başlat</button>
            )}
            {ended && seated && <button className="btn primary fb-big" disabled={busy} onClick={() => send('reset')}>Lobiye dön</button>}
          </div>
        )}
      </section>

      {/* ---- Soru günlüğü ---- */}
      <section className="fb-log">
        <h2>Soru günlüğü</h2>
        {g.log.length === 0 ? <p className="fb-empty">Henüz cevaplanmış soru yok.</p> : (
          <ol reversed>
            {[...g.log].map((x, k) => ({ x, k })).reverse().map(({ x, k }) => (
              <li key={k} className={x.a}>
                <span>Soru {k + 1}</span>
                <em>{nameOf(x.by)}</em>
                <b>{x.a === 'yes' ? 'EVET' : 'HAYIR'}</b>
              </li>
            ))}
          </ol>
        )}
        {lastWrong.length > 0 && (
          <p className="fb-wrong"><Icon name="x" />Yanlış tahminler: {lastWrong.map((x) => `${nameOf(x.by)}: ${x.w || '-'}`).join(' · ')}</p>
        )}
      </section>

      {/* ---- Puan tablosu ---- */}
      <section className="fb-board">
        <h2>Puan tablosu</h2>
        <ul>
          {ranking.map(({ i, s, pts }) => (
            <li key={i} className={`${s.left ? 'gone' : ''}${i === room.me ? ' me' : ''}${pts === top && top > 0 ? ' lead' : ''}`}>
              <Avatar i={i} name={s.name} />
              <span className="nm">
                <b>{s.name}{i === room.me ? ' (sen)' : ''}</b>
                {!ended && ph !== 'over' && i === g.holder && <small>tutan</small>}
                {!ended && ph !== 'over' && i === g.turn && i !== g.holder && <small>sırada</small>}
                {s.left && <small>ayrıldı</small>}
              </span>
              <em>{g.wins[i] ?? 0} tur</em>
              <strong>{pts}</strong>
            </li>
          ))}
        </ul>
      </section>

      {err && <p className="mono-err" role="alert">{err}</p>}
      {seated && (
        sure
          ? <button className="btn sm danger" disabled={busy} onClick={() => { setSure(false); send('leave'); }}>Evet, masadan ayrıl</button>
          : <button className="btn sm" onClick={() => setSure(true)}>Masadan ayrıl</button>
      )}
    </div>
  );
}
