'use client';

import { useId, useState } from 'react';

// SSS akordiyonu: beyaz kart, açılınca sarı artı düğmesi döner.
export default function Accordion({ children, title, active = false }: { children: React.ReactNode; title: string; active?: boolean }) {
  const [open, setOpen] = useState(active);
  const id = useId();

  return (
    <div className={`rounded-xl border-[2.5px] border-ink bg-paper transition-shadow ${open ? 'shadow-[2px_2px_0_var(--color-ink)]' : 'shadow-[4px_4px_0_var(--color-ink)]'}`}>
      <h3 className="font-sans tracking-normal">
        <button
          id={`${id}-t`}
          className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left font-semibold"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${id}-p`}
        >
          <span>{title}</span>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 border-ink transition ${open ? 'rotate-45 bg-sun' : 'bg-white'}`} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
        </button>
      </h3>
      <div
        id={`${id}-p`}
        role="region"
        aria-labelledby={`${id}-t`}
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{children}</p>
        </div>
      </div>
    </div>
  );
}
