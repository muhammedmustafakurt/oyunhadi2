// Vampir Köylü: gizli rollü gece/gündüz oyunu. Geceleri vampirler birini öldürmeyi seçer, doktor birini korur,
// kahin birinin vampir olup olmadığına bakar. Gündüz herkes oylayıp birini köyden eler.
// Tüm vampirler elenirse köylüler, vampirler diğerlerine eşit ya da çok olursa vampirler kazanır.
// Roller ve gece seçimleri yalnızca sunucuda tutulur; her oyuncuya kendi bilgisi gider (viewFor).
export const ROLE = {
  vampir: { name: 'Vampir', icon: '🧛', info: 'Her gece diğer vampirlerle birlikte bir köylüyü öldürmeyi seçersin. Gündüz masum görün.' },
  koylu: { name: 'Köylü', icon: '🧑‍🌾', info: 'Gece uyursun. Gündüz tartışıp vampirleri bulmaya çalış.' },
  doktor: { name: 'Doktor', icon: '🩺', info: 'Her gece birini korursun (kendini de). Vampirler o kişiyi seçerse ölmez. Aynı kişiyi üst üste iki gece koruyamazsın.' },
  kahin: { name: 'Kahin', icon: '🔮', info: 'Her gece birine bakıp vampir olup olmadığını öğrenirsin. Bunu kimseye kanıtlayamazsın, dikkatli ol.' },
};

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const aliveIdx = (g) => g.alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
const roleIdx = (g, role) => aliveIdx(g).filter((i) => g.roles[i] === role);
const emptyNight = () => ({ kill: {}, protect: null, inspect: null });
const ACTION_ROLE = { kill: 'vampir', protect: 'doktor', inspect: 'kahin' };

export function newGame(n) {
  const v = Math.max(1, Math.floor(n / 3));
  const roles = shuffle([...Array(v).fill('vampir'), 'doktor', 'kahin', ...Array(n - v - 2).fill('koylu')]);
  return {
    roles,
    alive: Array(n).fill(true),
    phase: 'night',
    day: 1,
    night: emptyNight(), // { kill: { [vampir]: hedef }, protect, inspect }
    votes: {}, // { [oylayan]: hedef | -1 (çekimser) }
    lastProtect: null, // doktorun önceki gece koruduğu kişi (üst üste koruma yasak)
    seer: [], // kahinin gördükleri: { day, target, vamp }
    log: ['Gece başladı. Köy uykuya daldı.'],
    note: 'Gece 1: vampirler, doktor ve kahin seçimlerini yapıyor.',
    over: null, // { winner: 'village' | 'vampires' | 'none', text }
  };
}

const finish = (g, winner, text) => ({ ...g, phase: 'over', over: { winner, text }, note: text, log: [...g.log, text] });

function checkWin(g) {
  const al = aliveIdx(g);
  const v = al.filter((i) => g.roles[i] === 'vampir').length;
  if (v === 0) return finish(g, 'village', 'Tüm vampirler yakalandı. Köylüler kazandı!');
  if (v >= al.length - v) return finish(g, 'vampires', 'Vampirler köyü ele geçirdi. Vampirler kazandı!');
  return null;
}

function nightReady(g) {
  if (!roleIdx(g, 'vampir').every((i) => g.night.kill[i] !== undefined)) return false;
  if (roleIdx(g, 'doktor').length && g.night.protect === null) return false;
  if (roleIdx(g, 'kahin').length && g.night.inspect === null) return false;
  return true;
}

function pickMax(counts) {
  const max = Math.max(...Object.values(counts));
  return shuffle(Object.keys(counts).filter((k) => counts[k] === max).map(Number))[0];
}

function resolveNight(g, seats) {
  const alive = [...g.alive];
  const counts = {};
  // Seçim yapmayan vampir (zaman aşımı) o gece oy kullanmamış sayılır.
  roleIdx(g, 'vampir').forEach((i) => { const t = g.night.kill[i]; if (t === undefined) return; counts[t] = (counts[t] || 0) + 1; });
  const hasVictim = Object.keys(counts).length > 0;
  const victim = hasVictim ? pickMax(counts) : null;
  const saved = victim !== null && victim === g.night.protect;
  const seer = g.night.inspect !== null && roleIdx(g, 'kahin').length
    ? [...g.seer, { day: g.day, target: g.night.inspect, vamp: g.roles[g.night.inspect] === 'vampir' }]
    : g.seer;
  let text;
  if (!hasVictim || saved) text = 'Bu gece kimse ölmedi.';
  else { alive[victim] = false; text = `${seats[victim].name} gece vampirler tarafından öldürüldü. Rolü: ${ROLE[g.roles[victim]].name}.`; }
  let n = { ...g, alive, seer, lastProtect: g.night.protect, night: emptyNight(), votes: {}, phase: 'day', log: [...g.log, `Gündüz ${g.day}: ${text}`], note: `Gündüz ${g.day}: ${text} Şimdi tartışıp birini oylayın.` };
  return checkWin(n) || n;
}

function votersReady(g) {
  return aliveIdx(g).every((i) => g.votes[i] !== undefined);
}

function resolveDay(g, seats) {
  const counts = {};
  Object.values(g.votes).forEach((t) => { if (t >= 0 && g.alive[t]) counts[t] = (counts[t] || 0) + 1; });
  const tally = Object.keys(counts).map(Number).sort((a, b) => counts[b] - counts[a]).map((t) => `${seats[t].name} ${counts[t]}`).join(', ');
  const entries = Object.entries(counts);
  const max = entries.length ? Math.max(...entries.map(([, c]) => c)) : 0;
  const top = entries.filter(([, c]) => c === max).map(([t]) => Number(t));
  const alive = [...g.alive];
  let text;
  if (top.length !== 1) text = `Oylar: ${tally || 'çekimser'}. Oylar eşit ya da çekimser, kimse elenmedi.`;
  else { alive[top[0]] = false; text = `Oylar: ${tally}. ${seats[top[0]].name} köyden elendi. Rolü: ${ROLE[g.roles[top[0]]].name}.`; }
  const n = { ...g, alive, votes: {}, night: emptyNight(), phase: 'night', day: g.day + 1, log: [...g.log, text], note: text };
  const w = checkWin(n);
  if (w) return w;
  n.log = [...n.log, `Gece ${n.day} başladı.`];
  n.note = `${text} Gece ${n.day} başladı.`;
  return n;
}

const need = (g, idx, phase, roleName) => {
  if (g.over) return 'Tur bitti.';
  if (g.phase !== phase) return phase === 'night' ? 'Şu an gece değil.' : 'Şu an gündüz değil.';
  if (!g.alive[idx]) return 'Öldüğünüz için işlem yapamazsınız.';
  if (roleName && g.roles[idx] !== roleName) return 'Bu işlem rolünüze ait değil.';
  return null;
};
const validTarget = (g, t, self = null) => Number.isInteger(t) && g.alive[t] && t !== self;

export function nightAction(g, seats, idx, type, target) {
  const roleName = { kill: 'vampir', protect: 'doktor', inspect: 'kahin' }[type];
  if (!Object.prototype.hasOwnProperty.call(ACTION_ROLE, type)) return { error: 'Geçersiz işlem.' };
  const e = need(g, idx, 'night', ACTION_ROLE[type]);
  if (e) return { error: e };
  if (!validTarget(g, target, type === 'inspect' ? idx : null)) return { error: 'Geçersiz seçim.' };
  if (type === 'kill' && g.roles[target] === 'vampir') return { error: 'Bir vampiri öldüremezsiniz.' };
  if (type === 'protect' && target === g.lastProtect) return { error: 'Geçen gece koruduğunuz kişiyi üst üste koruyamazsınız.' };
  const night = { ...g.night };
  if (type === 'kill') night.kill = { ...night.kill, [idx]: target };
  else night[type] = target;
  const n = { ...g, night };
  return nightReady(n) ? resolveNight(n, seats) : n;
}

// Gece zaman aşımı: seçim yapmayan vampirler, doktor ve kahin o gece etkisiz sayılır (eksik seçim = seçim yok).
// Gece normal çözümlenir; en az bir vampir hedef seçtiyse o hedef geçerli kalır, hiç seçim yoksa kimse ölmez.
export function nightTimeout(g, seats) {
  if (g.over) return { error: 'Tur bitti.' };
  if (g.phase !== 'night') return { error: 'Şu an gece değil.' };
  return resolveNight(g, seats);
}

export function castVote(g, seats, idx, target) {
  const e = need(g, idx, 'day', null);
  if (e) return { error: e };
  if (target !== -1 && !validTarget(g, target, idx)) return { error: 'Geçersiz seçim.' };
  const n = { ...g, votes: { ...g.votes, [idx]: target } };
  return votersReady(n) ? resolveDay(n, seats) : n;
}

// Oyuncu masadan ayrıldı: köyden ayrılmış (ölü) sayılır.
export function onLeave(g, seats, idx) {
  if (g.over || !g.alive[idx]) return g;
  const alive = [...g.alive];
  alive[idx] = false;
  const votes = { ...g.votes };
  delete votes[idx];
  // Ayrılanı hedef almış seçimler geçersizdir; ilgili kişi yeniden seçim yapar.
  const night = { ...g.night, kill: {} };
  Object.entries(g.night.kill).forEach(([v, t]) => { if (Number(v) !== idx && t !== idx) night.kill[v] = t; });
  if (g.roles[idx] === 'doktor' || night.protect === idx) night.protect = null;
  if (g.roles[idx] === 'kahin' || night.inspect === idx) night.inspect = null;
  let n = { ...g, alive, votes, night, log: [...g.log, `${seats[idx].name} köyü terk etti. Rolü: ${ROLE[g.roles[idx]].name}.`] };
  const w = checkWin(n);
  if (w) return w;
  if (n.phase === 'night' && nightReady(n)) return resolveNight(n, seats);
  if (n.phase === 'day' && aliveIdx(n).length && votersReady(n)) return resolveDay(n, seats);
  return n;
}

// Bir oyuncuya giden görünüm: kendi rolü ve (vampirse) diğer vampirler dışında gizli bilgi içermez.
export function viewFor(g, idx) {
  if (!g) return null;
  const role = idx >= 0 ? g.roles[idx] : null;
  const over = !!g.over;
  const mine = role === 'vampir' ? g.night.kill[idx] : role === 'doktor' ? g.night.protect : role === 'kahin' ? g.night.inspect : undefined;
  return {
    phase: g.phase,
    day: g.day,
    alive: g.alive,
    roles: g.roles.map((r, i) => (!g.alive[i] || over ? r : null)), // ölünce ya da tur bitince açıklanır
    me: idx < 0 ? null : {
      role,
      mates: role === 'vampir' ? g.roles.map((r, i) => (r === 'vampir' && i !== idx ? i : -1)).filter((i) => i >= 0) : [],
      blocked: role === 'doktor' ? g.lastProtect : null, // doktorun bu gece seçemeyeceği kişi
    },
    choice: mine === undefined || mine === null ? null : mine, // bu gece benim seçimim
    vampChoices: role === 'vampir' ? g.night.kill : null, // vampirler birbirinin seçimini görür
    seer: role === 'kahin' ? g.seer : null,
    voted: g.phase === 'day' ? Object.keys(g.votes).map(Number) : [],
    myVote: idx >= 0 && g.votes[idx] !== undefined ? g.votes[idx] : null,
    log: g.log.slice(-8),
    note: g.note,
    over: g.over,
  };
}
