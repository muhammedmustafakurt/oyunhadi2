'use client';

export type GameOpt = { id: string; name: string };

// Oyun onay kutuları (VENUE_GAMES listesinden). Seçim üst bileşende tutulur.
export default function GamesPicker({ games, value, onChange }: { games: GameOpt[]; value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const flip = (id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id); else n.add(id);
    onChange(games.filter((g) => n.has(g.id)).map((g) => g.id));
  };
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 flex w-full items-center justify-between text-sm font-medium">
        <span>Oyunlar ({value.length}/{games.length})</span>
        <span className="text-muted-foreground flex gap-3 text-xs">
          <button type="button" className="underline-offset-4 hover:underline" onClick={() => onChange(games.map((g) => g.id))}>Tümü</button>
          <button type="button" className="underline-offset-4 hover:underline" onClick={() => onChange([])}>Hiçbiri</button>
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <label key={g.id} className="bg-card flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input type="checkbox" checked={set.has(g.id)} onChange={() => flip(g.id)} />
            {g.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
