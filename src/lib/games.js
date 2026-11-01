// Kafeler için pazar analizi: masada oynanan popüler kutu oyunları.
// play: true olanlar telefonda oynanır; diğerleri listede "Yakında" görünür.
export const GAMES = [
  { id: 'monopoly', name: 'Emlak Krallığı', players: '2-4', minutes: '60-120', note: 'Mülk al, kira topla', play: true },
  { id: 'satranc', name: 'Satranç', players: '2', minutes: '20-60', note: 'Stratejinin başı', play: true },
  { id: 'spyfall', name: 'Casus', players: '3-8', minutes: '8-10', note: 'Casusu bul, mekânı sakla', play: true, tableOnly: true },
  { id: 'ajanlar', name: 'Gizli Ajanlar', players: '4-8', minutes: '15-20', note: 'İpucu ver, ajanları bul', play: true, tableOnly: true },
  { id: 'vampir', name: 'Vampir Köylü', players: '5-10', minutes: '20-30', note: 'Geceleri vampirler avlanır', play: true, tableOnly: true },
  { id: 'tabu', name: 'Tabu', players: '4-10', minutes: '15-20', note: 'Yasaklı kelimeleri söylemeden anlat', play: true, tableOnly: true },
  { id: 'kimim', name: 'Ben Kimim?', players: '3-10', minutes: '10-15', note: 'Alnındaki kartı tahmin et', play: true, tableOnly: true },
  { id: 'cizim', name: 'Çiz Bakalım', players: '3-10', minutes: '15-20', note: 'Çiz, arkadaşların tahmin etsin', play: true, tableOnly: true },
  { id: 'bil', name: 'Bil Bakalım', players: '2-10', minutes: '5-8', note: 'Hızlı bil, puanı kap', play: true, tableOnly: true },
  { id: 'catan', name: 'Catan', players: '3-4', minutes: '60-90', note: 'Kaynak topla, ticaret yap', play: true, tableOnly: true },
  { id: 'risk', name: 'Risk', players: '2-6', minutes: '90-120', note: 'Dünyayı fethet', play: true, tableOnly: true },
  { id: 'cluedo', name: 'Cluedo', players: '3-6', minutes: '45', note: 'Katili bul', play: true, tableOnly: true },
  { id: 'scrabble', name: 'Scrabble', players: '2-4', minutes: '60', note: 'Harflerle kelime kur', play: true, tableOnly: true },
  { id: 'ticket', name: 'Ticket to Ride', players: '2-5', minutes: '45-60', note: 'Tren hatlarını birleştir', play: true, tableOnly: true },
  { id: 'carcassonne', name: 'Carcassonne', players: '2-5', minutes: '35', note: 'Karo koy, şehir kur', play: true, tableOnly: true },
  { id: 'kadro', name: 'Kadro', players: '2-8', minutes: '5-8', note: 'Süper Lig kadronu kur, puanını kap', play: true, tableOnly: true },
  { id: 'futbolcu', name: 'Futbolcuyu Bul', players: '2-10', minutes: '10-15', note: 'Evet-hayır sorularıyla futbolcuyu bul', play: true, tableOnly: true },
  { id: 'azul', name: 'Azul', players: '2-4', minutes: '30-45', note: 'Fayanslarla duvar ör', play: true, tableOnly: true },
];
