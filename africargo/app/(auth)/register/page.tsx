import Link from "next/link";

import { register } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Verify your email before creating an organisation workspace.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {!configured ? (
          <p role="status" className="mt-4 rounded-lg bg-warn-light p-3 text-sm text-ink">
            Registration is not configured. Set the Supabase URL, anon key, and site URL in the server environment.
          </p>
        ) : null}
        <form action={register} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Full name
            <input
              required
              name="fullName"
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={12}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <Button type="submit" className="w-full" disabled={!configured}>Create account</Button>
        </form>
        <p className="mt-5 text-sm text-ink-muted">
          Already registered? <Link href="/login" className="text-accent">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
