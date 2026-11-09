"use server";

import { z } from "zod";
import { and, eq, isNull, lte } from "drizzle-orm";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getOrganisationMembership } from "@/lib/auth/organisations";
import { organisationInvitations } from "@/lib/db/schema";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const invitableRoles = [
  "organisation_admin",
  "operations_manager",
  "clearing_agent",
  "freight_officer",
  "transport_manager",
  "driver",
  "finance_officer",
  "customer",
  "auditor",
] as const;

const invitationSchema = z.object({
  organisationId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(invitableRoles),
});

export async function inviteMember(formData: FormData) {
  const parsed = invitationSchema.safeParse({
    organisationId: formData.get("organisationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/dashboard/settings?error=Check+the+invitation+details");
  }

  const user = await requireCurrentUser();
  const currentMembership = await getOrganisationMembership(
    user.id,
    user.email,
    parsed.data.organisationId,
  );

  if (!currentMembership || !can(currentMembership.role, "members.invite")) {
    throw new Error("You do not have permission to invite members to this organisation.");
  }

  const admin = createSupabaseAdminClient();
  const invitationId = crypto.randomUUID();
  const email = parsed.data.email.toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required to send organisation invitations.");
  }
  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", "/accept-invitation");

  await withUserDatabaseContext(user.id, user.email, async (transaction) => {
    await transaction
      .delete(organisationInvitations)
      .where(
        and(
          eq(organisationInvitations.organisationId, parsed.data.organisationId),
          eq(organisationInvitations.email, email),
          isNull(organisationInvitations.acceptedAt),
          lte(organisationInvitations.expiresAt, new Date()),
        ),
      );

    await transaction.insert(organisationInvitations).values({
      id: invitationId,
      organisationId: parsed.data.organisationId,
      email,
      role: parsed.data.role,
      invitedBy: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  });

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { africargo_invitation_id: invitationId },
    redirectTo: callbackUrl.toString(),
  });

  if (error) {
    await withUserDatabaseContext(user.id, user.email, (transaction) =>
      transaction
        .delete(organisationInvitations)
        .where(
          and(
            eq(organisationInvitations.id, invitationId),
            eq(organisationInvitations.invitedBy, user.id),
          ),
        ),
    );
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/dashboard/settings?organisation=${parsed.data.organisationId}&success=Invitation+sent`,
  );
}
