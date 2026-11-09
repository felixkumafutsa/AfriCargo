import { updatePassword } from "@/app/auth/actions";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireCurrentUser();
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Choose a new password</h1>
        {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
        <form action={updatePassword} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            New password
            <input
              required
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={12}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      </Card>
    </main>
  );
}
