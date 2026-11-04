// Ödül sistemine uygun oyunlar. Yalnızca SUNUCU durumunda, oyun bittiğinde oyuncu başına kesin sayısal puan tutan
// oyunlar buradadır; her giriş `final(g, now)` ile koltuk sırasına göre puan dizisi verir, oyun bitmediyse null.
// İstemciden gelen hiçbir değere güvenilmez; bu dosya yalnızca odanın kayıtlı durumunu okur. Saf dosyadır
// (içe aktarma yok), hem sunucu kütüphanesi hem de db.js taşıması kullanır.
//
// Uygun olmayanlar (neden): kadro/okey/ticket/azul/catan/risk/cluedo/satranc/monopoly/tavla puanı ya ondalıklı ya da
// kazanan/elenme türü ya da el başına; futbolcu tur tur sürer ve kesin bir bitişi yoktur; tabu/kimim/vampir/spyfall/
// ajanlar takım ya da rol sonucudur (oyuncu başına puan değil).
export const REWARD_GAMES = {
  bil: { final: (g) => (g?.over && Array.isArray(g.scores) ? g.scores : null) },
  adam: { final: (g) => (g?.over && Array.isArray(g.scores) ? g.scores : null) },
  cizim: { final: (g) => (g?.over && Array.isArray(g.scores) ? g.scores : null) },
  // 2048: süre dolunca durum, ilk istekte kapanır; kayıtlı puanlar süre sonrası hamleyle değişmez (sunucu reddeder).
  g2048: { final: (g, now) => (g && Array.isArray(g.players) && (g.over || now >= g.endsAt) ? g.players.map((p) => p.s) : null) },
  scrabble: { final: (g) => (g?.over && Array.isArray(g.players) ? g.players.map((p) => p.score) : null) },
  carcassonne: { final: (g) => (g?.over && Array.isArray(g.over.scores) ? g.over.scores : null) },
  pisti: {
    final: (g) => {
      if (!g?.over || !Array.isArray(g.over.scores)) return null;
      const out = [];
      for (const r of g.over.scores) out[r.seat] = r.total;
      return out;
    },
  },
};

// Kuralda günlük sınır boşsa (NULL) uygulanan varsayılan üst sınır: mekân başına günde (TR saati) en çok bu kadar kod.
// Sınırsız kural, sahte pid'lerle oda açıp sahte puan toplayan saldırgana sınırsız ücretsiz ikram kodu verirdi.
export const DEFAULT_DAILY_CODE_LIMIT = 200;

export const REWARD_GAME_IDS = Object.keys(REWARD_GAMES);
export const isRewardGame = (id) => Object.prototype.hasOwnProperty.call(REWARD_GAMES, id);
