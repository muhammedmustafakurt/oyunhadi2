// Yeni masa oyunlarının tek kayıt yeri. Her oyun modülü şu arayüzü verir (örnek: pisti.js):
//   CONFIG   { min, max }                          koltuk sayısı
//   PREFIX   'ps'                                   eylem adı öneki (api/room bu önekli eylemleri geçirir)
//   newGame(seats)                                  seats: [{ name }] -> oyun durumu
//   act(g, seats, idx, type, payload) -> yeni durum | { error }   (kurallar ve rastgelelik sunucuda)
//   onLeave(g, seats, idx) -> yeni durum
//   viewFor(g, idx) -> istemciye giden görünüm (başkasının eli/gizli bilgisi çıkarılır)
// Zaman aşımı gerektiren oyun act içinde type 'xxtimeout' ile süreyi kendisi denetler.
import * as pisti from './pisti';
import * as okey from './okey';
import * as g2048 from './g2048';
import * as adam from './adam';

export const PLUGINS = { pisti, okey, g2048, adam };
