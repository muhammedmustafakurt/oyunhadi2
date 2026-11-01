// Casus (Spyfall tarzı) oyunu: bir oyuncu casus, diğerleri aynı gizli mekânda farklı rollerde.
// Oyuncular sırayla soru sorup casusu bulmaya, casus da mekânı anlamaya çalışır.
// Mekân ve casus yalnızca sunucuda tutulur; her telefona sadece kendi kartı gönderilir (viewFor).
export const LOCATIONS = [
  { name: 'Havaalanı', icon: '✈️', roles: ['Pilot', 'Hostes', 'Pasaport Memuru', 'Yolcu', 'Bagaj Görevlisi'] },
  { name: 'Hastane', icon: '🏥', roles: ['Doktor', 'Hemşire', 'Hasta', 'Ambulans Şoförü', 'Hasta Yakını'] },
  { name: 'Okul', icon: '🏫', roles: ['Öğretmen', 'Müdür', 'Öğrenci', 'Kantinci', 'Rehber Öğretmen'] },
  { name: 'Sinema', icon: '🎬', roles: ['Gişe Görevlisi', 'Seyirci', 'Projeksiyoncu', 'Bilet Kontrolcüsü', 'Mısır Satıcısı'] },
  { name: 'Restoran', icon: '🍽️', roles: ['Aşçı', 'Garson', 'Müşteri', 'Şef', 'Kasiyer'] },
  { name: 'Banka', icon: '🏦', roles: ['Veznedar', 'Müdür', 'Müşteri', 'Güvenlik Görevlisi', 'Kredi Danışmanı'] },
  { name: 'Plaj', icon: '🏖️', roles: ['Cankurtaran', 'Dondurmacı', 'Tatilci', 'Sörfçü', 'Fotoğrafçı'] },
  { name: 'Otel', icon: '🏨', roles: ['Resepsiyonist', 'Kat Görevlisi', 'Misafir', 'Komi', 'Otel Müdürü'] },
  { name: 'Tren İstasyonu', icon: '🚉', roles: ['Makinist', 'Biletçi', 'Yolcu', 'Kondüktör', 'Simitçi'] },
  { name: 'Müze', icon: '🏛️', roles: ['Rehber', 'Güvenlik', 'Ziyaretçi', 'Restoratör', 'Küratör'] },
  { name: 'Kapalıçarşı', icon: '🧿', roles: ['Esnaf', 'Müşteri', 'Turist', 'Çaycı', 'Halıcı'] },
  { name: 'Hamam', icon: '🧖', roles: ['Tellak', 'Natır', 'Müşteri', 'Kasiyer', 'Çaycı'] },
  { name: 'Uzay İstasyonu', icon: '🚀', roles: ['Komutan', 'Mühendis', 'Astronot', 'Bilim İnsanı', 'Doktor'] },
  { name: 'Yolcu Gemisi', icon: '🚢', roles: ['Kaptan', 'Aşçı', 'Yolcu', 'Tayfa', 'Müzisyen'] },
  { name: 'Karakol', icon: '👮', roles: ['Komiser', 'Polis', 'Şüpheli', 'Avukat', 'Gazeteci'] },
  { name: 'Spor Salonu', icon: '🏋️', roles: ['Antrenör', 'Üye', 'Resepsiyonist', 'Diyetisyen', 'Temizlik Görevlisi'] },
  { name: 'Düğün Salonu', icon: '💍', roles: ['Gelin', 'Damat', 'Davetli', 'Müzisyen', 'Fotoğrafçı'] },
  { name: 'Lunapark', icon: '🎡', roles: ['Bilet Satıcısı', 'Ziyaretçi', 'Operatör', 'Palyaço', 'Güvenlik'] },
  { name: 'Kütüphane', icon: '📚', roles: ['Kütüphaneci', 'Öğrenci', 'Yazar', 'Araştırmacı', 'Okuyucu'] },
  { name: 'Kafe', icon: '☕', roles: ['Barista', 'Garson', 'Müşteri', 'Kasiyer', 'Kafe Sahibi'] },
  { name: 'Süpermarket', icon: '🛒', roles: ['Kasiyer', 'Reyon Görevlisi', 'Müşteri', 'Müdür', 'Güvenlik'] },
  { name: 'Stadyum', icon: '⚽', roles: ['Futbolcu', 'Hakem', 'Taraftar', 'Antrenör', 'Spiker'] },
  { name: 'Çiftlik', icon: '🚜', roles: ['Çiftçi', 'Veteriner', 'Çoban', 'Ziyaretçi', 'Traktör Sürücüsü'] },
  { name: 'Sirk', icon: '🎪', roles: ['Palyaço', 'Akrobat', 'Jonglör', 'Seyirci', 'Terbiyeci'] },
  { name: 'Berber', icon: '💈', roles: ['Berber', 'Çırak', 'Müşteri', 'Kuaför', 'Manikürcü'] },
  { name: 'Pastane', icon: '🧁', roles: ['Pastacı', 'Tezgâhtar', 'Müşteri', 'Kurye', 'Kasiyer'] },
  { name: 'Eczane', icon: '💊', roles: ['Eczacı', 'Hasta', 'Kalfa', 'Temsilci', 'Müşteri'] },
  { name: 'Benzinlik', icon: '⛽', roles: ['Pompacı', 'Şoför', 'Market Görevlisi', 'Kasiyer', 'Tır Şoförü'] },
  { name: 'İtfaiye', icon: '🚒', roles: ['İtfaiye Eri', 'Amir', 'Santral Görevlisi', 'Şoför', 'Kurtarılan Kişi'] },
  { name: 'Orman', icon: '🌲', roles: ['Ormancı', 'Kampçı', 'Doğa Fotoğrafçısı', 'Avcı', 'Rehber'] },
  { name: 'Dağ Evi', icon: '🏔️', roles: ['Dağcı', 'Ev Sahibi', 'Kayakçı', 'Aşçı', 'Kurtarma Görevlisi'] },
  { name: 'Mahkeme', icon: '⚖️', roles: ['Hâkim', 'Savcı', 'Avukat', 'Sanık', 'Zabıt Katibi'] },
  { name: 'Radyo Stüdyosu', icon: '🎙️', roles: ['Sunucu', 'Teknisyen', 'Konuk', 'Yapımcı', 'Dinleyici'] },
  { name: 'Film Seti', icon: '🎥', roles: ['Yönetmen', 'Oyuncu', 'Kameraman', 'Dublör', 'Makyöz'] },
  { name: 'Konser', icon: '🎸', roles: ['Solist', 'Gitarist', 'Hayran', 'Ses Teknisyeni', 'Güvenlik'] },
  { name: 'Piknik Alanı', icon: '🧺', roles: ['Aile Babası', 'Çocuk', 'Mangalcı', 'Bisikletçi', 'Balon Satıcısı'] },
  { name: 'Hayvanat Bahçesi', icon: '🦁', roles: ['Bakıcı', 'Veteriner', 'Ziyaretçi', 'Rehber', 'Biletçi'] },
  { name: 'Akvaryum', icon: '🐠', roles: ['Dalgıç', 'Biyolog', 'Ziyaretçi', 'Rehber', 'Temizlikçi'] },
  { name: 'Kampüs', icon: '🎓', roles: ['Profesör', 'Öğrenci', 'Asistan', 'Yurt Müdürü', 'Kantinci'] },
  { name: 'Laboratuvar', icon: '🔬', roles: ['Bilim İnsanı', 'Asistan', 'Stajyer', 'Güvenlik', 'Teknisyen'] },
  { name: 'Fabrika', icon: '🏭', roles: ['İşçi', 'Ustabaşı', 'Mühendis', 'Müdür', 'Kalite Kontrolcü'] },
  { name: 'Şantiye', icon: '🏗️', roles: ['Mimar', 'İnşaat İşçisi', 'Vinç Operatörü', 'Mühendis', 'Müteahhit'] },
  { name: 'Otogar', icon: '🚌', roles: ['Şoför', 'Muavin', 'Yolcu', 'Bilet Satıcısı', 'Hamal'] },
  { name: 'Liman', icon: '⚓', roles: ['Kaptan', 'Liman Başkanı', 'Gemici', 'Balıkçı', 'Gümrük Memuru'] },
  { name: 'Cami Avlusu', icon: '🕌', roles: ['İmam', 'Müezzin', 'Cemaat', 'Turist', 'Temizlik Görevlisi'] },
  { name: 'Pazar Yeri', icon: '🍅', roles: ['Manav', 'Müşteri', 'Balıkçı', 'Hamal', 'Zabıta'] },
  { name: 'Alışveriş Merkezi', icon: '🛍️', roles: ['Satış Danışmanı', 'Müşteri', 'Güvenlik', 'Kasiyer', 'Temizlik Görevlisi'] },
  { name: 'Doğum Günü Partisi', icon: '🎂', roles: ['Doğum Günü Çocuğu', 'Anne', 'Arkadaş', 'Animatör', 'Pastacı'] },
  { name: 'Kamp Alanı', icon: '⛺', roles: ['Kampçı', 'Rehber', 'Çocuk', 'Aşçı', 'Orman Bekçisi'] },
  { name: 'Tiyatro', icon: '🎭', roles: ['Oyuncu', 'Yönetmen', 'Seyirci', 'Kostümcü', 'Sufle'] },
  { name: 'Arı Kovanı Çiftliği', icon: '🐝', roles: ['Arıcı', 'Ziyaretçi', 'Bal Satıcısı', 'Kontrolör', 'Çırak'] },
  { name: 'Denizaltı', icon: '🛥️', roles: ['Kaptan', 'Sonarcı', 'Mühendis', 'Aşçı', 'Dümenci'] },
  { name: 'Göbeklitepe Kazısı', icon: '⛏️', roles: ['Arkeolog', 'İşçi', 'Rehber', 'Turist', 'Restoratör'] },
];



export const DURATION_MS = 8 * 60 * 1000;
// Bir mekânın rol sayısı (5) yetmezse her oyuncuya farklı rol düşsün diye yedek roller (en fazla 10 oyuncu).
const EXTRA_ROLES = ['Ziyaretçi', 'Çalışan', 'Tanık', 'Komşu', 'Gezgin'];
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const activeOf = (seats) => seats.map((s, i) => (s.left ? -1 : i)).filter((i) => i >= 0);

export function newGame(n, now = Date.now()) {
  const loc = Math.floor(Math.random() * LOCATIONS.length);
  const pool = [...shuffle([...LOCATIONS[loc].roles]), ...shuffle([...EXTRA_ROLES])];
  return {
    loc,
    spy: Math.floor(Math.random() * n),
    roles: Array.from({ length: n }, (_, i) => pool[i % pool.length]),
    startedAt: now,
    endsAt: now + DURATION_MS,
    first: Math.floor(Math.random() * n),
    accused: [], // suçlama başlatmış oyuncular (herkes bir kez)
    vote: null, // { by, target, votes: { [koltuk]: true } }
    note: '',
    over: null, // { winner: 'players' | 'spy' | 'none', text }
  };
}

const ALL = (g) => Array.from({ length: g.roles.length }, (_, i) => i);

// Tur puanları (kazanma nedenine göre):
// caught: casus yakalandı -> suçlayan 2, diğer oyuncular 1 | wrong: yanlış suçlama -> casus 4
// guess: casus doğru mekânı bildi -> casus 4 | guessWrong: yanlış tahmin -> oyuncular 1
// timeout: süre doldu -> casus 2 | left: casus ayrıldı -> oyuncular 1
function scoreRound(g, kind, by, act) {
  const pts = Array(g.roles.length).fill(0);
  const crew = act.filter((i) => i !== g.spy);
  if (kind === 'caught') crew.forEach((i) => { pts[i] = i === by ? 2 : 1; });
  else if (kind === 'wrong' || kind === 'guess') pts[g.spy] = 4;
  else if (kind === 'guessWrong' || kind === 'left') crew.forEach((i) => { pts[i] = 1; });
  else if (kind === 'timeout') pts[g.spy] = 2;
  return pts;
}

const finish = (g, winner, text, kind = 'none', by = null, act = ALL(g)) =>
  ({ ...g, vote: null, over: { winner, text, kind, points: scoreRound(g, kind, by, act) } });

export function accuse(g, seats, by, target, now = Date.now()) {
  if (g.over) return { error: 'Tur bitti.' };
  if (now >= g.endsAt) return { error: 'Süre doldu.' };
  if (g.vote) return { error: 'Zaten bir oylama sürüyor.' };
  const act = activeOf(seats);
  if (!act.includes(by) || !act.includes(target) || by === target) return { error: 'Geçersiz suçlama.' };
  if (g.accused.includes(by)) return { error: 'Bu turda zaten bir kez suçlama yaptınız.' };
  const n = { ...g, accused: [...g.accused, by], vote: { by, target, votes: { [by]: true } } };
  n.note = `${seats[by].name}, ${seats[target].name} kişisini casus olmakla suçluyor.`;
  return resolve(n, seats);
}

// Suçlanan dışındaki herkes "evet" derse suçlama sonuçlanır; biri "hayır" derse oylama iptal olur.
export function castVote(g, seats, idx, yes, now = Date.now()) {
  if (g.over || !g.vote) return { error: 'Açık bir oylama yok.' };
  if (now >= g.endsAt) return timeout(g, now);
  const act = activeOf(seats);
  if (!act.includes(idx) || idx === g.vote.target) return { error: 'Bu oylamada oy kullanamazsınız.' };
  if (g.vote.votes[idx] !== undefined) return { error: 'Oyunuzu zaten kullandınız.' };
  if (!yes) return { ...g, vote: null, note: `${seats[idx].name} suçlamayı reddetti, oylama iptal oldu.` };
  return resolve({ ...g, vote: { ...g.vote, votes: { ...g.vote.votes, [idx]: true } } }, seats);
}

function resolve(g, seats) {
  const voters = activeOf(seats).filter((i) => i !== g.vote.target);
  if (!voters.every((i) => g.vote.votes[i])) return g;
  const t = g.vote.target;
  const act = activeOf(seats);
  return t === g.spy
    ? finish(g, 'players', `Casus yakalandı: ${seats[t].name}. Oyuncular kazandı!`, 'caught', g.vote.by, act)
    : finish(g, 'spy', `${seats[t].name} casus değildi. Yanlış suçlama, casus kazandı!`, 'wrong', null, act);
}

export function guess(g, seats, idx, loc, now = Date.now()) {
  if (g.over) return { error: 'Tur bitti.' };
  if (idx !== g.spy) return { error: 'Yalnızca casus mekânı tahmin edebilir.' };
  if (g.vote) return { error: 'Oylama sürerken mekân tahmin edilemez.' };
  if (now >= g.endsAt) return { error: 'Süre doldu.' };
  if (!Number.isInteger(loc) || loc < 0 || loc >= LOCATIONS.length) return { error: 'Geçersiz mekân.' };
  const act = activeOf(seats);
  return loc === g.loc
    ? finish(g, 'spy', `Casus mekânı bildi: ${LOCATIONS[g.loc].name}. Casus kazandı!`, 'guess', null, act)
    : finish(g, 'players', `Casus "${LOCATIONS[loc].name}" dedi ama mekân ${LOCATIONS[g.loc].name}. Oyuncular kazandı!`, 'guessWrong', null, act);
}

export function timeout(g, now = Date.now()) {
  if (g.over) return g;
  if (now < g.endsAt) return { error: 'Süre henüz dolmadı.' };
  return finish(g, 'spy', 'Süre doldu, casus yakalanamadı. Casus kazandı!', 'timeout');
}

// Oyuncu masadan ayrıldı (seats'te left işaretlendikten sonra çağrılır).
export function onLeave(g, seats, idx) {
  if (g.over) return g;
  if (idx === g.spy) return finish(g, 'players', `Casus (${seats[idx].name}) masadan ayrıldı. Oyuncular kazandı!`, 'left', null, activeOf(seats));
  if (activeOf(seats).length < 3) return finish(g, 'none', 'Oyuncu sayısı 3\'ün altına indi, tur iptal edildi.');
  let n = g;
  // ayrılan oyuncunun oylaması/suçlaması açıksa iptal et
  if (g.vote && (g.vote.by === idx || g.vote.target === idx)) n = { ...n, vote: null, note: 'Oylama, oyuncu ayrıldığı için iptal oldu.' };
  return n.vote ? resolve(n, seats) : n;
}

// Bir oyuncuya giden görünüm: kendi kartı dışında gizli bilgi içermez. Tur bitince herkes açıklanır.
export function viewFor(g, idx, now = Date.now()) {
  if (!g) return null;
  let over = g.over;
  if (!over && now >= g.endsAt) over = { winner: 'spy', text: 'Süre doldu, casus yakalanamadı. Casus kazandı!', kind: 'timeout', points: scoreRound(g, 'timeout', null, ALL(g)) };
  return {
    leftMs: Math.max(0, g.endsAt - now),
    first: g.first,
    accused: g.accused,
    vote: g.vote,
    note: g.note,
    over: over ? { ...over, spy: g.spy, loc: g.loc } : null,
    roles: over ? g.roles : null,
    me: idx < 0 ? null : idx === g.spy ? { spy: true } : { spy: false, loc: g.loc, role: g.roles[idx] },
  };
}
