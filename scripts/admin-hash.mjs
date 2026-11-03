// Süper-admin şifre karması üretir: node scripts/admin-hash.mjs
// Şifre komut satırı argümanı olarak ALINMAZ (kabuk geçmişine düşmesin); gizli istemle sorulur. Çıktı: salt:hash
// (src/lib/db.js hashPassword ile aynı scrypt biçimi). Şifre hiçbir yere yazılmaz.
import { randomBytes, scryptSync } from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1 };

function ask(prompt) {
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      let buf = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (d) => (buf += d));
      stdin.on('end', () => resolve(buf.split(/\r?\n/)[0]));
      return;
    }
    let s = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stderr.write('\n');
          return resolve(s);
        }
        if (c === '\u0003') process.exit(130);
        if (c === '\u007f' || c === '\b') s = s.slice(0, -1);
        else s += c;
      }
    };
    stdin.on('data', onData);
  });
}

const pw = await ask('Yeni admin şifresi (en az 12 karakter): ');
if (pw.length < 12 || pw.length > 256) {
  console.error('Şifre 12-256 karakter olmalı.');
  process.exit(1);
}
if (process.stdin.isTTY) {
  const again = await ask('Şifre (tekrar): ');
  if (again !== pw) {
    console.error('Şifreler eşleşmiyor.');
    process.exit(1);
  }
}
const salt = randomBytes(16).toString('hex');
console.log(`${salt}:${scryptSync(pw, salt, 32, SCRYPT).toString('hex')}`);
