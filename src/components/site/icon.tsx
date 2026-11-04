// Site ikonları: 16px, tek renk.
const P: Record<string, React.ReactNode> = {
  group: <path d="M5.5 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM0 13c0-2.5 2.2-4.5 5.5-4.5 1.2 0 2.2.3 3 .7.8-.4 1.8-.7 3-.7C14.8 8.5 16 10.5 16 13v1H0v-1Z" />,
  qr: <path d="M1 1h6v6H1V1Zm2 2v2h2V3H3Zm6-2h6v6H9V1Zm2 2v2h2V3h-2ZM1 9h6v6H1V9Zm2 2v2h2v-2H3Zm6-2h2v2H9V9Zm4 0h2v2h-2V9Zm-2 2h2v2h-2v-2Zm-2 2h2v2H9v-2Zm4 0h2v2h-2v-2Z" />,
  palette: <path d="M8 0a8 8 0 0 0 0 16c1.1 0 1.7-.8 1.7-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H12a4 4 0 0 0 4-4C16 3 12.4 0 8 0ZM3.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm2-3.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm2 3.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />,
  gift: <path d="M2 6h12v3H2V6Zm1 4h4v6H3v-6Zm6 0h4v6H9v-6ZM5.5 1C6.9 1 8 2.4 8 4c0-1.6 1.1-3 2.5-3S13 2.1 13 3.2 12 5 10.5 5h-5C4 5 3 4.3 3 3.2S4.1 1 5.5 1Z" />,
  chart: <path d="M1 14h14v2H1v-2Zm1-6h3v5H2V8Zm4.5-4h3v9h-3V4ZM11 1h3v12h-3V1Z" />,
  megaphone: <path d="M14 1v12L8 10H5l1 5H3.5L2 10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6l6-3Z" />,
  pin: <path d="M8 0a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6Zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />,
  toggle: <path d="M5 3h6a5 5 0 0 1 0 10H5A5 5 0 0 1 5 3Zm6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  nfc: <path d="M3 4.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2L3 4.5Zm3.5-3a9 9 0 0 1 0 13l-1.4-1.4a7 7 0 0 0 0-10.2L6.5 1.5ZM10 0a13 13 0 0 1 0 16l-1.4-1.3a11 11 0 0 0 0-13.4L10 0Z" />,
  check: <path d="M14.3 2.6a1 1 0 0 0-1.6-1.2L6.4 9.5 3.2 6.3a1 1 0 1 0-1.4 1.4l4 4a1 1 0 0 0 1.5-.1l7-9ZM1 14a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H1Z" />,
};

export default function Icon({ name, className = 'fill-coral' }: { name: string; className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
      {P[name] ?? P.check}
    </svg>
  );
}

// İkon kutusu: renkli kare içinde beyaz ikon
const TONES = { coral: 'bg-coral', grape: 'bg-grape', sky: 'bg-sky', leaf: 'bg-leaf', rose: 'bg-rose', sun: 'bg-sun' } as const;
export function IconBox({ name, tone = 'coral' }: { name: string; tone?: keyof typeof TONES }) {
  return (
    <span className={`grid h-12 w-12 -rotate-6 place-items-center rounded-xl border-[2.5px] border-ink shadow-[3px_3px_0_var(--color-ink)] ${TONES[tone]}`}>
      <Icon name={name} className={tone === 'sun' ? 'fill-ink' : 'fill-white'} />
    </span>
  );
}
