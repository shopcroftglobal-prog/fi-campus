import Link from "next/link";
import { Kpi } from "@/components/Kpi";
import { PageHero } from "@/components/PageHero";
import { getProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isStaff } from "@/lib/roles";
import { num, rupees, shortDate } from "@/lib/format";

export const metadata = { title: "Overview" };

type Notice = { id: string; title: string; category: string; published_at: string };

export default async function OverviewPage() {
  const profile = (await getProfile())!;
  const supabase = await createClient();

  // Every query runs under the signed-in user's row-level security, so each role only counts what it may see.
  const [students, enquiries, grievances, dues, notices] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).not("stage", "in", "(enrolled,lost)"),
    supabase.from("grievances").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]),
    supabase.from("student_dues").select("due"),
    supabase.from("notices").select("id, title, category, published_at").order("published_at", { ascending: false }).limit(5),
  ]);

  const totalDue = dues.error ? null : (dues.data ?? []).reduce((s, r) => s + Number((r as { due: number }).due ?? 0), 0);
  const firstName = profile.full_name.split(/\s+/)[0];
  const staff = isStaff(profile.role);

  return (
    <>
      <PageHero eyebrow={staff ? "Control room" : "My campus"} title={`Good to see you, ${firstName}`} sub="Live numbers from the campus database. Each figure only counts what your role is allowed to see." />
      <section className="kpis">
        {staff ? (
          <>
            <Kpi label="Active students" value={students.error ? "—" : num(students.count)} />
            <Kpi label="Open enquiries" value={enquiries.error ? "—" : num(enquiries.count)} note="Not yet enrolled or lost" />
            <Kpi label="Fees outstanding" value={totalDue == null ? "—" : rupees(totalDue)} tone={totalDue ? "warn" : "good"} />
            <Kpi label="Open grievances" value={grievances.error ? "—" : num(grievances.count)} tone={grievances.count ? "warn" : "good"} />
          </>
        ) : (
          <>
            <Kpi label="Fees due" value={totalDue == null ? "—" : rupees(totalDue)} tone={totalDue ? "warn" : "good"} />
            <Kpi label="My open grievances" value={grievances.error ? "—" : num(grievances.count)} />
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Latest notices</h2>
        </div>
        {(notices.data as Notice[] | null)?.length ? (
          <ul className="list">
            {(notices.data as Notice[]).map((n) => (
              <li key={n.id}>
                <span className="chip">{n.category}</span>
                <span className="grow">{n.title}</span>
                <span className="muted">{shortDate(n.published_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted pad">No notices yet. Published notices will appear here and on the college website.</p>
        )}
      </section>

      {staff && (
        <p className="muted small pad">
          Looking for someone? Open the <Link href="/students">Student Directory</Link>.
        </p>
      )}
    </>
  );
}
