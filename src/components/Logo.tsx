const PETAL = "M0-5C-15-13-15-33 0-41 15-33 15-13 0-5Z";

/** The college's "Care Petals" mark: four petals forming a cross, one in marigold. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="F.I. College of Nursing">
      <rect width="100" height="100" rx="24" fill="var(--accent)" />
      <g transform="translate(50 50)">
        <path d={PETAL} fill="#fff" />
        <path d={PETAL} fill="#fff" transform="rotate(90)" />
        <path d={PETAL} fill="#fff" transform="rotate(180)" />
        <path d={PETAL} fill="var(--flame)" transform="rotate(270)" />
      </g>
    </svg>
  );
}
