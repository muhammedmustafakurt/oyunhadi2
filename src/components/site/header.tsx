'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './logo';
import { NAV } from '@/lib/site';

// Üst menü: tam genişlik şerit, solda logo, ortada bağlantılar, sağda koyu hap düğme. Kaydırınca krem zemin alır.
export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // Ana sayfanın en üstünde menü yeşil çuhanın üstünde durur: açık renk yazı.
  const onFelt = path === '/' && !scrolled && !open;

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b-[3px] border-transparent transition-colors ${scrolled || open ? 'border-ink bg-cream' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo light={onFelt} />
        <nav className="hidden flex-1 md:block" aria-label="Ana menü">
          <ul className="flex items-center gap-1 text-[15px] font-semibold">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`rounded-lg border-2 px-3 py-1.5 transition-colors ${path?.startsWith(n.href) ? 'border-ink bg-sun text-ink shadow-[2px_2px_0_var(--color-ink)]' : onFelt ? 'border-transparent text-white hover:border-white' : 'border-transparent text-ink hover:border-ink hover:bg-sun'}`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/panel/giris" className={`hidden rounded-lg px-3 py-2 text-[15px] font-bold underline-offset-4 hover:underline sm:block ${onFelt ? 'text-white' : 'text-ink'}`}>Mekân girişi</Link>
          <Link href="/teklif" className={`btn-sm ${onFelt ? 'btn-sun' : 'btn-dark'}`}>Teklif al</Link>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 md:hidden ${onFelt ? 'border-white text-white hover:bg-white/15' : 'border-ink bg-white text-ink shadow-[2px_2px_0_var(--color-ink)] hover:bg-sun'}`}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t-[3px] border-ink px-4 pb-5 md:hidden" aria-label="Mobil menü">
          <ul className="grid gap-1 pt-3 text-lg font-semibold">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="block rounded-lg px-3 py-3 font-bold hover:bg-sun">{n.label}</Link></li>
            ))}
            <li><Link href="/panel/giris" className="block rounded-lg px-3 py-3 font-bold hover:bg-sun">Mekân girişi</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
