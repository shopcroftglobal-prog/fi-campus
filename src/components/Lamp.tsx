/** The college's nursing-lamp emblem, reused from the approved demo. */
export function Lamp({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--accent)" />
      <path d="M20 8c2.6 3 3.6 5.2 3.6 7a3.6 3.6 0 0 1-7.2 0c0-1.8 1-4 3.6-7Z" fill="var(--flame)" />
      <path d="M9 25c3.5-2.4 7.2-3.6 11-3.6h8.5c1.8 0 3 1.2 3 2.6 0 1.5-1.3 2.7-3 2.7H22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 25.5c1.5 3.6 4.6 5.5 9 5.5s7.4-1.9 9-5.3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
