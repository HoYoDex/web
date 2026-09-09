import { useEffect, useMemo, useRef, useState } from 'react';

interface Entry { i: string; t: string; g: string; c: string[] }

/** Subsequence match with a cheap relevance score — good enough for ~2k titles. */
function score(entry: Entry, q: string): number {
  const t = entry.t.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500 - t.length;
  const at = t.indexOf(q);
  if (at !== -1) return 300 - at - t.length * 0.1;
  if (entry.c.some((c) => c.toLowerCase().includes(q))) return 50;
  return -1;
}

export default function Search({ games }: { games: { slug: string; name: string; accent: string }[] }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [q, setQ] = useState('');
  const [game, setGame] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
    input.current?.focus();

    // Deep-link support: /search?q=hu+tao
    const p = new URLSearchParams(location.search).get('q');
    if (p) setQ(p);
  }, []);

  const results = useMemo(() => {
    if (!entries) return [];
    const needle = q.trim().toLowerCase();
    const pool = game ? entries.filter((e) => e.g === game) : entries;
    if (!needle) return pool.slice(0, 60);

    return pool
      .map((e) => ({ e, s: score(e, needle) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 60)
      .map((r) => r.e);
  }, [entries, q, game]);

  const accentOf = (slug: string) => games.find((g) => g.slug === slug)?.accent ?? '#71717a';

  return (
    <div>
      <input
        ref={input}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search characters, weapons, quests, lore…"
        aria-label="Search the index"
        className="w-full rounded-lg border border-void-600 bg-void-900 px-4 py-3 text-lg text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-astral-500"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setGame('')}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${game === '' ? 'border-astral-500 text-astral-400' : 'border-void-600 text-zinc-400 hover:border-zinc-500'}`}>
          All games
        </button>
        {games.map((g) => (
          <button key={g.slug} onClick={() => setGame(game === g.slug ? '' : g.slug)}
            style={game === g.slug ? { borderColor: g.accent, color: g.accent } : undefined}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${game === g.slug ? '' : 'border-void-600 text-zinc-400 hover:border-zinc-500'}`}>
            {g.name}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-zinc-500" aria-live="polite">
        {entries === null ? 'Loading index…' : `${results.length}${results.length === 60 ? '+' : ''} result${results.length === 1 ? '' : 's'}`}
      </p>

      <ul className="mt-3 divide-y divide-void-800 rounded-lg border border-void-700">
        {results.map((e) => (
          <li key={e.i}>
            <a href={`/wiki/${e.i}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-void-800/60">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accentOf(e.g) }} />
              <span className="truncate text-zinc-200">{e.t}</span>
              <span className="ml-auto hidden shrink-0 truncate text-xs text-zinc-600 sm:block">{e.c[0]}</span>
            </a>
          </li>
        ))}
      </ul>

      {entries !== null && results.length === 0 && (
        <p className="mt-6 text-center text-zinc-500">
          Nothing matched “{q}”. Try a broader term, or
          <a className="ml-1 text-astral-400 underline" href="https://genshin-impact.fandom.com" rel="noopener">write the page on the wiki</a>.
        </p>
      )}
    </div>
  );
}
