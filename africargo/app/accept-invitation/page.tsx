import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { acceptInvitation } from "@/app/invitations/actions";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";
import { organisationInvitations, organisations } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage() {
  const user = await requireCurrentUser();
  const invitations = await withUserDatabaseContext(
    user.id,
    user.email,
    (transaction) =>
      transaction
        .select({
          id: organisationInvitations.id,
          organisationName: organisations.name,
          role: organisationInvitations.role,
          expiresAt: organisationInvitations.expiresAt,
        })
        .from(organisationInvitations)
        .innerJoin(
          organisations,
          eq(organisationInvitations.organisationId, organisations.id),
        )
        .where(
          and(
            eq(organisationInvitations.email, user.email.toLowerCase()),
            isNull(organisationInvitations.acceptedAt),
            gt(organisationInvitations.expiresAt, new Date()),
          ),
        ),
  );

  if (invitations.length === 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Organisation invitation</h1>
        <p className="mt-2 text-sm text-ink-muted">
          You are signed in as {user.email}. Accept the invitation to join the workspace.
        </p>
        <ul className="mt-5 space-y-4">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="rounded-lg border border-surface-border p-4">
              <p className="font-medium text-ink">{invitation.organisationName}</p>
              <p className="mt-1 text-sm capitalize text-ink-muted">
                Role: {invitation.role.replaceAll("_", " ")}
              </p>
              <form action={acceptInvitation} className="mt-3">
                <input type="hidden" name="invitationId" value={invitation.id} />
                <Button type="submit">Accept invitation</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
