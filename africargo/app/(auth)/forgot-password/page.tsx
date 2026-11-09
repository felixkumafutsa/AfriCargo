import Link from "next/link";

import { requestPasswordReset } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your email address and we will send a secure reset link.
        </p>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        {sent ? (
          <p role="status" className="mt-4 text-sm text-accent-dark">
            If the address is registered, a reset email has been sent.
          </p>
        ) : null}
        {!configured ? (
          <p role="status" className="mt-4 rounded-lg bg-warn-light p-3 text-sm text-ink">
            Password reset is unavailable until Supabase and the site URL are configured.
          </p>
        ) : null}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
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
          <Button type="submit" className="w-full" disabled={!configured}>Send reset link</Button>
        </form>
        <Link href="/login" className="mt-5 inline-block text-sm text-accent">
          Return to sign in
        </Link>
      </Card>
    </main>
  );
}
