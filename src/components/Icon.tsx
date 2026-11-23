import type { IconName } from "@/lib/roles";

const PATHS: Record<IconName, string> = {
  overview: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z",
  students: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.3 3.1-6 7-6s7 2.7 7 6",
  admissions: "M5 4h14v16H5zM9 9h6M9 13h6M9 17h3",
  fees: "M4 7h16v11H4zM4 11h16M8 15h3",
  attendance: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4M9 14l2 2 4-4",
  clinical: "M12 4v16M4 12h16",
  notices: "M5 10v4l10 4V6L5 10Zm10-1h3a2 2 0 0 1 0 6h-3",
  grievance: "M5 5h14v10H9l-4 4V5Z",
  audit: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
