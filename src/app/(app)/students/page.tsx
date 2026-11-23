import { redirect } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { getProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { canOpen } from "@/lib/roles";

export const metadata = { title: "Student Directory" };

type Row = {
  id: string;
  student_code: string;
  full_name: string;
  city: string | null;
  phone: string | null;
  status: string;
  batches: { admission_year: number; current_year: number; section: string | null; programmes: { code: string; name: string } | null } | null;
};

const STATUS_LABEL: Record<string, string> = { active: "Active", on_leave: "On leave", passed_out: "Passed out", left: "Left" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = (await getProfile())!;
  if (!canOpen(profile.role, "/students")) redirect("/overview");

  const { q = "" } = await searchParams;
  const term = q.trim().replace(/[%,()]/g, "");
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("id, student_code, full_name, city, phone, status, batches(admission_year, current_year, section, programmes(code, name))", { count: "exact" })
    .order("full_name")
    .limit(100);
  if (term) query = query.or(`full_name.ilike.%${term}%,student_code.ilike.%${term}%,phone.ilike.%${term}%`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHero eyebrow="Students" title="Student Directory" hue="sky" sub="Search by name, student ID or phone number." />
      <form className="search" role="search">
        <input name="q" defaultValue={q} placeholder="Search students…" aria-label="Search students" />
        <button className="btn primary">Search</button>
      </form>

      <section className="card">
        <div className="card-head">
          <h2>{term ? `Results for “${term}”` : "All students"}</h2>
          <span className="muted">{error ? "" : `${count ?? 0} found`}</span>
        </div>
        {error ? (
          <p className="form-error pad">Couldn&apos;t load students. {error.message}</p>
        ) : rows.length === 0 ? (
          <p className="muted pad">{term ? "No one matches that search." : "No students added yet."}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Programme</th>
                <th className="hide-m">Year</th>
                <th className="hide-m">City</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.full_name}</strong>
                    <span className="muted block">{s.student_code}</span>
                  </td>
                  <td>{s.batches?.programmes?.code ?? "—"}</td>
                  <td className="hide-m">
                    {s.batches ? `Year ${s.batches.current_year}${s.batches.section ? ` · ${s.batches.section}` : ""}` : "—"}
                  </td>
                  <td className="hide-m">{s.city ?? "—"}</td>
                  <td>
                    <span className={`chip status-${s.status}`}>{STATUS_LABEL[s.status] ?? s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
