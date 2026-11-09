import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { inviteMember } from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getOrganisationMembership, getUserOrganisations } from "@/lib/auth/organisations";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";
import { memberships, userProfiles } from "@/lib/db/schema";

export default async function OrganisationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; error?: string; success?: string }>;
}) {
  const user = await requireCurrentUser();
  const organisations = await getUserOrganisations(user.id, user.email);
  const { organisation: requestedId, error, success } = await searchParams;
  const selected = requestedId
    ? organisations.find((organisation) => organisation.organisationId === requestedId)
    : organisations[0];

  if (requestedId && !selected) {
    throw new Error("You do not have access to the requested organisation.");
  }
  if (!selected) {
    redirect("/onboarding");
  }

  const membership = await getOrganisationMembership(
    user.id,
    user.email,
    selected.organisationId,
  );
  if (!membership) {
    throw new Error("Active organisation membership was not found.");
  }

  const members = await withUserDatabaseContext(user.id, user.email, (transaction) =>
    transaction
      .select({
        fullName: userProfiles.fullName,
        email: userProfiles.email,
        role: memberships.role,
        status: memberships.status,
      })
      .from(memberships)
      .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .where(
        and(
          eq(memberships.organisationId, selected.organisationId),
          eq(memberships.status, "active"),
        ),
      ),
  );
  const canInvite = can(membership.role, "members.invite");
  const invitationsConfigured = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SITE_URL,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Organisation settings</h1>
        <p className="mt-1 text-sm text-ink-muted">{selected.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Members and roles</CardTitle>
        </CardHeader>
        <ul className="divide-y divide-surface-border">
          {members.map((member) => (
            <li key={member.email} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <span className="font-medium">{member.fullName} <span className="font-normal text-ink-muted">{member.email}</span></span>
              <span className="capitalize text-ink-muted">
                {member.role.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      {canInvite && invitationsConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite a team member</CardTitle>
          </CardHeader>
          {error ? <p role="alert" className="mb-4 text-sm text-red-700">{error}</p> : null}
          {success ? <p role="status" className="mb-4 text-sm text-accent-dark">{success}</p> : null}
          <form action={inviteMember} className="grid gap-4 sm:grid-cols-3">
            <input type="hidden" name="organisationId" value={selected.organisationId} />
            <label className="text-sm font-medium">
              Email address
              <input
                type="email"
                required
                name="email"
                className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium">
              Role
              <select
                name="role"
                className="mt-1 w-full rounded-lg border border-surface-border bg-white px-3 py-2"
              >
                <option value="organisation_admin">Organisation admin</option>
                <option value="operations_manager">Operations manager</option>
                <option value="clearing_agent">Clearing agent</option>
                <option value="freight_officer">Freight officer</option>
                <option value="transport_manager">Transport manager</option>
                <option value="driver">Driver</option>
                <option value="finance_officer">Finance officer</option>
                <option value="customer">Customer</option>
                <option value="auditor">Auditor</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Send invitation</Button>
            </div>
          </form>
        </Card>
      ) : null}
      {canInvite && !invitationsConfigured ? (
        <p role="status" className="text-sm text-ink-muted">
          Team invitations are unavailable until server-side Supabase invitation settings are configured.
        </p>
      ) : null}
    </div>
  );
}
