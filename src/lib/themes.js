// Hazır renk temaları (panel /panel/marka). Tek kaynak: panel seçici, önizleme ve sunucu doğrulaması buradan okur.
// Seçim venues.color/accent sütunlarına yazılır; theme_id yalnızca hangi paletin seçildiğini hatırlar (beyaz liste).
// Her paletin ana/ikinci rengi, onColor (src/components/oyun/on-color.ts) ile okunur yazı rengi alır.
/** @type {{ id: string, name: string, color: string, accent: string }[]} */
export const THEMES = [
  { id: 'mercan', name: 'Mercan', color: '#ff4f2e', accent: '#ffc83d' },
  { id: 'lavanta', name: 'Lavanta', color: '#7c3aed', accent: '#c4b5fd' },
  { id: 'okyanus', name: 'Okyanus', color: '#0369a1', accent: '#67e8f9' },
  { id: 'orman', name: 'Orman', color: '#166534', accent: '#a3e635' },
  { id: 'gunbatimi', name: 'Gün batımı', color: '#f59e0b', accent: '#e11d48' },
  { id: 'gul', name: 'Gül', color: '#be185d', accent: '#fbcfe8' },
  { id: 'gece', name: 'Gece mavisi', color: '#1e3a8a', accent: '#fbbf24' },
  { id: 'kahve', name: 'Kahve', color: '#78350f', accent: '#f59e0b' },
];
export const THEME_IDS = THEMES.map((t) => t.id);
