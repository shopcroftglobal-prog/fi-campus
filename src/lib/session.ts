import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export type Profile = { id: string; full_name: string; role: AppRole; department: string | null; designation: string | null };

/** The signed-in user's campus profile. Cached per request. Redirects to /login when signed out. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("id, full_name, role, department, designation").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});
