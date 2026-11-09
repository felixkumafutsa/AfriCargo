import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireCurrentUser(): Promise<User & { email: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Could not verify the current session: ${error.message}`);
  }
  if (!data.user) {
    redirect("/login");
  }
  const user = data.user;
  if (!user.email) {
    throw new Error("The authenticated account does not have an email address.");
  }
  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return { ...user, email: user.email };
}
