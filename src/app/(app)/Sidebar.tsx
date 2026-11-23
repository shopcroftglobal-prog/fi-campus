"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { NavItem } from "@/lib/roles";

export function Sidebar({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const sections = [...new Set(items.map((i) => i.section))];
  return (
    <nav aria-label="Main">
      {sections.map((s) => (
        <div key={s} className="nav-section">
          <p className="nav-heading">{s}</p>
          {items
            .filter((i) => i.section === s)
            .map((i) =>
              i.ready ? (
                <Link key={i.href} href={i.href} className={`nav-link ${path.startsWith(i.href) ? "active" : ""}`}>
                  <Icon name={i.icon} />
                  {i.label}
                </Link>
              ) : (
                <span key={i.href} className="nav-link soon" title="Coming in this release">
                  <Icon name={i.icon} />
                  {i.label}
                  <em>Soon</em>
                </span>
              ),
            )}
        </div>
      ))}
    </nav>
  );
}
