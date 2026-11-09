"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { memberships, organisationInvitations } from "@/lib/db/schema";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";

const invitationIdSchema = z.string().uuid();

export async function acceptInvitation(formData: FormData) {
  const parsed = invitationIdSchema.safeParse(formData.get("invitationId"));
  if (!parsed.success) {
    throw new Error("The organisation invitation is invalid.");
  }

  const user = await requireCurrentUser();
  await withUserDatabaseContext(user.id, user.email, async (transaction) => {
    const [invitation] = await transaction
      .select()
      .from(organisationInvitations)
      .where(
        and(
          eq(organisationInvitations.id, parsed.data),
          eq(organisationInvitations.email, user.email.toLowerCase()),
          isNull(organisationInvitations.acceptedAt),
          gt(organisationInvitations.expiresAt, new Date()),
        ),
      )
      .limit(1)
      .for("update");

    if (!invitation) {
      throw new Error("This invitation is expired, already used, or belongs to another email.");
    }

    await transaction
      .insert(memberships)
      .values({
        organisationId: invitation.organisationId,
        userId: user.id,
        branchId: invitation.branchId,
        role: invitation.role,
        status: "active",
      })
      .onConflictDoNothing();

    await transaction
      .update(organisationInvitations)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(organisationInvitations.id, invitation.id),
          isNull(organisationInvitations.acceptedAt),
        ),
      );
  });

  redirect("/dashboard");
}
