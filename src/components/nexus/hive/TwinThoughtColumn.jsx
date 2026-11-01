import { useEffect, useState } from 'react';

export default function TwinThoughtColumn({ title, twin, accent, run }) {
  const steps = twin ? [...(twin.thoughts || []), `Opinion: ${twin.opinion}`, `Idea: ${twin.idea}`] : [];
  const [shown, setShown] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => { setShown(0); setChars(0); }, [run]);
  useEffect(() => {
    if (shown >= steps.length) return undefined;
    const t = setTimeout(() => {
      if (chars < steps[shown].length) setChars((c) => c + 3);
      else { setShown((s) => s + 1); setChars(0); }
    }, 18);
    return () => clearTimeout(t);
  }, [shown, chars, steps]);

  return (
    <div className="p-3 rounded bg-background border border-border space-y-2 min-h-40">
      <div className={`text-[11px] font-semibold ${accent}`}>{title}</div>
      {steps.slice(0, shown + 1).map((s, i) => (
        <p key={i} className="text-[11px] leading-relaxed text-foreground">
          <span className={accent}>›</span> {i < shown ? s : s.slice(0, chars)}
          {i === shown && <span className="animate-pulse">▍</span>}
        </p>
      ))}
      {!twin && <p className="text-[10px] text-muted-foreground">Waiting for a task…</p>}
    </div>
  );
}