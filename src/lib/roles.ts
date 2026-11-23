export type AppRole =
  | "principal"
  | "vice_principal"
  | "accounts"
  | "admission"
  | "hod"
  | "faculty"
  | "preceptor"
  | "warden"
  | "student"
  | "parent";

export type NavItem = { href: string; label: string; section: string; icon: IconName; ready: boolean };
export type IconName = "overview" | "students" | "fees" | "attendance" | "clinical" | "admissions" | "notices" | "grievance" | "audit" | "home";

export const ROLE_LABEL: Record<AppRole, string> = {
  principal: "Principal",
  vice_principal: "Vice Principal",
  accounts: "Accounts Officer",
  admission: "Admission Officer",
  hod: "Head of Department",
  faculty: "Faculty",
  preceptor: "Clinical Preceptor",
  warden: "Hostel Warden",
  student: "Student",
  parent: "Parent",
};

const STAFF_NAV: NavItem[] = [
  { href: "/overview", label: "Overview", section: "Control room", icon: "overview", ready: true },
  { href: "/admissions", label: "Admissions & CRM", section: "Students", icon: "admissions", ready: false },
  { href: "/students", label: "Student Directory", section: "Students", icon: "students", ready: true },
  { href: "/fees", label: "Fees & Finance", section: "Students", icon: "fees", ready: false },
  { href: "/attendance", label: "Attendance", section: "Students", icon: "attendance", ready: false },
  { href: "/clinical", label: "Clinical Logbook", section: "Academics", icon: "clinical", ready: false },
  { href: "/notices", label: "Notices", section: "Campus life", icon: "notices", ready: false },
  { href: "/grievances", label: "Grievances", section: "Campus life", icon: "grievance", ready: false },
  { href: "/audit", label: "Audit Trail", section: "Security", icon: "audit", ready: false },
];

/** Which menu entries each role sees. Database row-level security is the real gate; this only shapes the menu. */
const STAFF_ACCESS: Partial<Record<AppRole, string[]>> = {
  principal: STAFF_NAV.map((n) => n.href),
  vice_principal: ["/overview", "/students", "/attendance", "/clinical", "/notices", "/grievances"],
  accounts: ["/overview", "/students", "/fees", "/audit"],
  admission: ["/overview", "/admissions", "/students", "/notices"],
  hod: ["/overview", "/students", "/attendance", "/clinical", "/grievances"],
  faculty: ["/overview", "/attendance", "/clinical"],
  preceptor: ["/overview", "/attendance", "/clinical"],
  warden: ["/overview", "/students", "/grievances"],
};

const FAMILY_NAV: NavItem[] = [
  { href: "/overview", label: "Home", section: "My campus", icon: "home", ready: true },
  { href: "/fees", label: "Fees & Receipts", section: "My campus", icon: "fees", ready: false },
  { href: "/attendance", label: "Attendance", section: "My campus", icon: "attendance", ready: false },
  { href: "/clinical", label: "Clinical Logbook", section: "Academics", icon: "clinical", ready: false },
  { href: "/notices", label: "Notices", section: "Help desk", icon: "notices", ready: false },
  { href: "/grievances", label: "Grievances", section: "Help desk", icon: "grievance", ready: false },
];

export function navFor(role: AppRole): NavItem[] {
  if (role === "student" || role === "parent") {
    return FAMILY_NAV.filter((n) => role === "student" || n.href !== "/clinical");
  }
  const allowed = STAFF_ACCESS[role] ?? ["/overview"];
  return STAFF_NAV.filter((n) => allowed.includes(n.href));
}

export function canOpen(role: AppRole, href: string): boolean {
  return navFor(role).some((n) => n.href === href);
}

export function isStaff(role: AppRole) {
  return role !== "student" && role !== "parent";
}
