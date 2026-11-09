import Link from "next/link";

import { signIn } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Sign in to AfriCargo</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Access your organisation workspace.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {!configured ? (
          <p role="status" className="mt-4 rounded-lg bg-warn-light p-3 text-sm text-ink">
            Authentication is not configured. Set the Supabase URL and anon key in the server environment.
          </p>
        ) : null}
        <form action={signIn} className="mt-6 space-y-4">
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
              autoComplete="current-password"
              minLength={12}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <Button type="submit" className="w-full" disabled={!configured}>Sign in</Button>
        </form>
        <p className="mt-5 text-sm text-ink-muted">
          New to AfriCargo? <Link href="/register" className="text-accent">Create an account</Link>
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          <Link href="/forgot-password" className="text-accent">Forgot password?</Link>
        </p>
      </Card>
    </main>
  );
}
