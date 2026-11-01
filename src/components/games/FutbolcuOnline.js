'use client';
import { useState } from 'react';
import Lobby from './Lobby';
import useRoom from './useRoom';
import Icon from './Icon';
import { PALETTE } from '@/lib/emlak';
import { WIN_POINTS } from '@/lib/futbolcu';

function Avatar({ i, name }) {
  return <i className="fb-av" style={{ background: PALETTE[i % PALETTE.length] }}>{(name || '?').trim().charAt(0).toUpperCase()}</i>;
}

// Futbolcuyu Bul: tutan oyuncu futbolcuyu aklında tutar (hiçbir yere yazılmaz), diğerleri masada sözlü soru sorar.
// Ekran yalnızca sırayı ve EVET/HAYIR cevaplarını yönetir; sesli iletişim yoktur (masada yüz yüze konuşulur).
export default function FutbolcuOnline({ cafe, masa }) {
  const ui = useRoom({ cafe, masa, game: 'futbolcu' });
  const { room, err, busy, send } = ui;
  const [sure, setSure] = useState(false);
  const g = room?.game;

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

        {g.note && <p className="fb-note">{g.note}</p>}

        {/* ---- Aşama kartı ---- */}
        {ph === 'hold' && (
          <div className="fb-card">
            {isHolder ? (
              <>
                <Icon name="brain" className="fb-ic" />
                <h2>Aklından bir futbolcu tut</h2>
                <p>Aktif ya da emekli, dünyanın herhangi bir ligi veya milli takımından olabilir. Adını kimseye söyleme, hiçbir yere yazma.</p>
                <p className="fb-warn">Aklındaki futbolcuyu değiştirme. Sorulara dürüstçe cevap ver.</p>
                <button className="btn primary fb-big" disabled={busy} onClick={() => send('fbready')}>Tuttum</button>
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
                <p>Masada sesli bir soru sor, sonra düğmeye bas. Bildiğini düşünüyorsan tahmin et.</p>
                <button className="btn primary fb-big" disabled={busy} onClick={() => send('fbask')}>Soruyu sordum</button>
                <button className="btn fb-big alt" disabled={busy} onClick={() => send('fbguess')}>Tahmin ediyorum</button>
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

        {ph === 'verdict' && (
          <div className="fb-card">
            <small className="fb-k">TAHMİN</small>
            <h2><Avatar i={g.turn} name={turnName} />{myTurn ? 'Tahmin ettin' : `${turnName} tahmin etti`}</h2>
            {isHolder ? (
              <>
                <p>Söylenen futbolcu aklındaki mi?</p>
                <div className="fb-yn">
                  <button className="fb-yes" disabled={busy} onClick={() => send('fbverdict', { yes: true })}><Icon name="check" />DOĞRU</button>
                  <button className="fb-no" disabled={busy} onClick={() => send('fbverdict', { yes: false })}><Icon name="x" />YANLIŞ</button>
                </div>
              </>
            ) : (
              <p>{holderName} değerlendiriyor…</p>
            )}
          </div>
        )}

        {ph === 'over' && (
          <div className="fb-card fb-over" role="status">
            <Icon name={ended ? 'flag' : 'trophy'} className="fb-ic" />
            <h2>{over.text}</h2>
            {!ended && (
              <p>
                <b>{g.questions}</b> soru sorundu, <b>{g.guesses}</b> tahmin yapıldı.
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
          <p className="fb-wrong"><Icon name="x" />Yanlış tahminler: {lastWrong.map((x) => nameOf(x.by)).join(', ')}</p>
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
