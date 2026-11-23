import { Lamp } from "@/components/Lamp";
import { getProfile } from "@/lib/session";
import { navFor, ROLE_LABEL } from "@/lib/roles";
import { Sidebar } from "./Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile) {
    return (
      <main className="empty-state">
        <Lamp size={48} />
        <h1>Your account isn&apos;t set up yet</h1>
        <p>You&apos;re signed in, but the college office hasn&apos;t given you a role. Ask them to add you, then sign in again.</p>
        <form action="/auth/signout" method="post">
          <button className="btn">Sign out</button>
        </form>
      </main>
    );
  }

  const initials = profile.full_name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Lamp />
          <div>
            <strong>FI Campus</strong>
            <span>College of Nursing</span>
          </div>
        </div>
        <Sidebar items={navFor(profile.role)} />
        <div className="me">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{profile.full_name}</strong>
            <span>{ROLE_LABEL[profile.role]}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="link-btn" aria-label="Sign out">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
