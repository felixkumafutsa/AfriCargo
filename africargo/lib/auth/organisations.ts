import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { memberships, organisations, platformAdmins } from "@/lib/db/schema";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";

export async function getUserOrganisations(userId: string, email: string) {
  return withUserDatabaseContext(userId, email, (transaction) =>
    transaction
      .select({
        organisationId: organisations.id,
        name: organisations.name,
        type: organisations.type,
        countryCode: organisations.countryCode,
        role: memberships.role,
        membershipCreatedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(
        organisations,
        eq(memberships.organisationId, organisations.id),
      )
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
      .orderBy(asc(memberships.createdAt)),
  );
}

export async function getOrganisationMembership(
  userId: string,
  email: string,
  organisationId: string,
) {
  return withUserDatabaseContext(userId, email, async (transaction) => {
    const [membership] = await transaction
      .select({
        organisationId: organisations.id,
        name: organisations.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(
        organisations,
        eq(memberships.organisationId, organisations.id),
      )
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organisationId, organisationId),
          eq(memberships.status, "active"),
        ),
      )
      .limit(1);

    return membership ?? null;
  });
}

export async function isPlatformSuperAdmin(userId: string, email: string) {
  return withUserDatabaseContext(userId, email, async (transaction) => {
    const [admin] = await transaction
      .select({ userId: platformAdmins.userId })
      .from(platformAdmins)
      .where(eq(platformAdmins.userId, userId))
      .limit(1);

    return Boolean(admin);
  });
}
