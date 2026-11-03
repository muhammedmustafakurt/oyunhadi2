// Etkinlik türlerinin ad ve simgeleri (istemciye de güvenle gider; veritabanı içe aktarmaz).
export const MASS = ['tombala', 'skor', 'cekilis'];
export const KIND_INFO: Record<string, { name: string; icon: string; go: string }> = {
  sinav: { name: 'Mekân Sınavı', icon: '🎯', go: 'Sınava gir' },
  tombala: { name: 'Tombala', icon: '🎱', go: 'Kartını al' },
  skor: { name: 'Masa Turnuvası', icon: '🏆', go: 'Sıralamayı gör' },
  cekilis: { name: 'Çekiliş', icon: '🎁', go: 'Çekilişe katıl' },
  turnuva: { name: 'Turnuva', icon: '🏆', go: 'Sınava gir' },
  diger: { name: 'Etkinlik', icon: '✨', go: 'Ayrıntılar' },
};
