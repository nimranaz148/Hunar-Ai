/**
 * Small flat "artifact" cards shown in the How it works chapter. All content is sample copy
 * that illustrates what the product produces; none of it is real user data.
 */

const shell =
  "w-[17.5rem] rounded-md border-2 border-ink bg-cream p-4 text-left text-ink";

export function ChatCard() {
  return (
    <div className={shell}>
      <p className="font-label text-xs tracking-[0.08em] text-fg-muted">BUSINESS PLANNER</p>
      <div className="mt-3 space-y-2 text-sm leading-snug">
        <p className="ml-auto w-fit max-w-[85%] rounded-md bg-lilac px-3 py-2">
          Mujhe ghar se cake business shuru karna hai.
        </p>
        <p className="w-fit max-w-[90%] rounded-md bg-ink px-3 py-2 text-cream">
          Zabardast! Pehle batayein, aap hafte mein kitne cakes bana sakti hain?
        </p>
        <p className="ml-auto w-fit max-w-[85%] rounded-md bg-lilac px-3 py-2">Takreeban 15.</p>
      </div>
    </div>
  );
}

export function CalendarCard() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const state = (d: number) => (d <= 18 ? "bg-violet text-white" : d <= 24 ? "bg-marigold text-ink" : "bg-surface-sunken text-ink");
  return (
    <div className={shell}>
      <p className="font-label text-xs tracking-[0.08em] text-fg-muted">30-DAY CONTENT CALENDAR</p>
      <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label="Sample calendar">
        {days.map((d) => (
          <li key={d} className={`grid aspect-square place-items-center rounded-[3px] text-xs font-semibold ${state(d)}`}>
            {d}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-violet" /> Approved</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-marigold" /> To review</span>
      </p>
    </div>
  );
}

export function MentorCard() {
  return (
    <div className={shell}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-plum font-display text-lg text-cream">M</span>
        <div>
          <p className="font-label text-lg font-bold leading-none tracking-wide">MARKETING MENTOR</p>
          <p className="mt-1 text-xs text-fg-muted">Verified · 45 min session</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Tue 4 pm", "Wed 11 am", "Fri 6 pm"].map((t, i) => (
          <span
            key={t}
            className={`rounded-[3px] border-2 border-ink px-2 py-1 text-xs font-semibold ${i === 1 ? "bg-ink text-cream" : ""}`}
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-between border-t border-ink pt-3 text-xs">
        <span>Payment is held until the session is done</span>
      </p>
    </div>
  );
}

export function GrowthCard() {
  const bars = [32, 48, 61, 86];
  return (
    <div className={`${shell}`}>
      <p className="font-label text-xs tracking-[0.08em] text-fg-muted">WEEKLY REVIEW</p>
      <div className="mt-3 flex h-28 items-end gap-2" role="img" aria-label="Sample revenue rising over four weeks">
        {bars.map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-[3px] ${i === 3 ? "bg-magenta" : "bg-violet"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-center text-[0.6875rem] font-semibold text-fg-muted">
        {["W1", "W2", "W3", "W4"].map((w) => (
          <span key={w} className="flex-1">{w}</span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-snug">
        <b>Coach:</b> Reels got the most inquiries. Post two more this week.
      </p>
    </div>
  );
}
