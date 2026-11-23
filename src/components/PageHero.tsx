type Hue = "teal" | "marigold" | "sky" | "coral" | "plum" | "slate";

/** Coloured header band with the animated ECG line, as in the demo. */
export function PageHero({ eyebrow, title, sub, hue = "teal", children }: { eyebrow: string; title: string; sub?: string; hue?: Hue; children?: React.ReactNode }) {
  return (
    <header className={`hero hue-${hue}`}>
      <svg className="ecg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 32h170l12-14 10 30 12-44 12 50 10-22h130l10-10 10 18 8-8h206" />
      </svg>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {sub && <p className="hero-sub">{sub}</p>}
      {children}
    </header>
  );
}
