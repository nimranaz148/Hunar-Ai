/**
 * Claims ticker. CSS-only marquee (paused on hover, off under reduced motion).
 * The list is duplicated for the seamless loop; the copy is aria-hidden so it is read once.
 */
export function Ticker({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="flex items-center whitespace-nowrap">
          <span className="font-label px-6 py-3 text-[1.0625rem] font-semibold tracking-[0.08em]">{t}</span>
          <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`marquee overflow-hidden ${className}`} role="region" aria-label="Highlights">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
