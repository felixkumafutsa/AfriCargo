import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisations } from "@/lib/auth/organisations";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string }>;
}) {
  const user = await requireCurrentUser();
  const organisations = await getUserOrganisations(user.id, user.email);
  const { organisation: requestedOrganisationId } = await searchParams;
  const selectedOrganisation = requestedOrganisationId
    ? organisations.find((organisation) => organisation.organisationId === requestedOrganisationId)
    : organisations[0];

  if (requestedOrganisationId && !selectedOrganisation) {
    throw new Error("You do not have access to the requested organisation.");
  }

  if (!selectedOrganisation) {
    throw new Error("No active organisation membership was found.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {selectedOrganisation.name} · {selectedOrganisation.countryCode}
          </p>
        </div>
        {organisations.length > 1 ? (
          <nav aria-label="Your organisations" className="flex flex-wrap gap-2">
            {organisations.map((organisation) => (
              <Link
                key={organisation.organisationId}
                href={`/dashboard?organisation=${organisation.organisationId}`}
                aria-current={
                  organisation.organisationId === selectedOrganisation.organisationId
                    ? "page"
                    : undefined
                }
                className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink hover:border-accent"
              >
                {organisation.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace ready</CardTitle>
        </CardHeader>
        <p className="text-sm text-ink-muted">
          Your organisation workspace is set up. Operational metrics will appear
          here when shipment and transport records are available.
        </p>
        <p className="mt-3 text-xs text-ink-faint">
          Signed in as {user.email ?? "verified user"} · {selectedOrganisation.role.replaceAll("_", " ")}
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisation access</CardTitle>
        </CardHeader>
        <ul className="space-y-2">
          {organisations.map((organisation) => (
            <li
              key={organisation.organisationId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span className="font-medium text-ink">{organisation.name}</span>
              <span className="text-ink-muted">
                {organisation.type.replaceAll("_", " ")} · {organisation.role.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
