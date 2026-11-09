"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=Enter+a+valid+email+and+password");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().email(),
      password: z.string().min(12),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

  if (!parsed.success) {
    redirect("/register?error=Check+the+form+and+try+again");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required to send the verification email.");
  }
  const callbackUrl = new URL("/auth/callback", siteUrl);

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/verify-email");
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = z
    .object({ email: z.string().email() })
    .safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    redirect("/forgot-password?error=Enter+a+valid+email+address");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required to send a password reset email.");
  }

  const supabase = await createSupabaseServerClient();
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", "/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl.toString(),
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const parsed = z
    .object({ password: z.string().min(12) })
    .safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    redirect("/reset-password?error=Password+must+contain+at+least+12+characters");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: sessionError } = await supabase.auth.getUser();

  if (sessionError) {
    throw new Error(`Could not verify the current session: ${sessionError.message}`);
  }
  if (!data.user) {
    redirect("/login?error=Your+password+reset+session+has+expired");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }

  redirect("/login");
}
