export function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {note && <p className={`kpi-note ${tone ?? ""}`}>{note}</p>}
    </div>
  );
}
