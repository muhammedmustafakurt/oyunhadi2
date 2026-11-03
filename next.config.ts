import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Yerel geliştirmede DATABASE_URL yoksa oyun odaları bellekteki PGlite'ta tutulur (bkz. src/lib/db.js).
  serverExternalPackages: ['@electric-sql/pglite'],
  experimental: { globalNotFound: true },
  // Geliştirmede admin alt alanı (http://admin.localhost:3000) için dev kaynaklarına izin.
  allowedDevOrigins: ['admin.localhost'],
  // Ana klasörde başka bir package-lock.json olduğu için proje kökünü açıkça belirtiyoruz.
  turbopack: { root: path.resolve(__dirname) },
  // Tüm yanıtlara temel güvenlik başlıkları (clickjacking, MIME sniffing, referrer sızıntısı, HTTP'ye düşme).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Betik kaynağını kısıtlamayan (Next'in satır içi betiklerini bozmayan) CSP yönergeleri.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
