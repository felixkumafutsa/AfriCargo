import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisations } from "@/lib/auth/organisations";
import { createOrganisation } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { organisationType } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const countries = [
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "ZM", name: "Zambia" },
  { code: "TZ", name: "Tanzania" },
] as const;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !process.env.AFRICARGO_DATABASE_URL
  ) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <div role="status" className="rounded-xl border border-surface-border bg-white p-6">
          <h1 className="text-xl font-semibold text-primary">Workspace setup required</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Configure Supabase Auth and the restricted AFRICARGO_DATABASE_URL runtime connection before onboarding.
          </p>
        </div>
      </main>
    );
  }

  const user = await requireCurrentUser();
  const organisations = await getUserOrganisations(user.id, user.email);
  const { error } = await searchParams;

  if (organisations.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Create your workspace</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set up your organisation to begin managing logistics operations.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <form action={createOrganisation} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Organisation name
            <input
              required
              name="name"
              maxLength={160}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Organisation type
            <select
              required
              name="type"
              className="mt-1 w-full rounded-lg border border-surface-border bg-white px-3 py-2"
            >
              {organisationType.enumValues.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Primary operating country
            <select
              required
              name="countryCode"
              className="mt-1 w-full rounded-lg border border-surface-border bg-white px-3 py-2"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Registration number <span className="font-normal text-ink-muted">(optional)</span>
            <input
              name="registrationNumber"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
            />
          </label>
          <Button type="submit" className="w-full">Create workspace</Button>
        </form>
      </Card>
    </main>
  );
}
