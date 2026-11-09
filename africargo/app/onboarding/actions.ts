"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { withUserDatabaseContext } from "@/lib/db/with-user-context";
import { memberships, organisations, organisationType } from "@/lib/db/schema";

const organisationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(organisationType.enumValues),
  countryCode: z.enum(["MW", "MZ", "ZM", "TZ"]),
  registrationNumber: z.string().trim().max(100).optional(),
});

export async function createOrganisation(formData: FormData) {
  const parsed = organisationSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    countryCode: formData.get("countryCode"),
    registrationNumber: formData.get("registrationNumber") || undefined,
  });

  if (!parsed.success) {
    redirect("/onboarding?error=Check+the+organisation+details");
  }

  const user = await requireCurrentUser();
  if (!user.email) {
    throw new Error("The authenticated account does not have a verified email.");
  }

  const organisation = await withUserDatabaseContext(
    user.id,
    user.email,
    async (transaction) => {
      const [created] = await transaction
        .insert(organisations)
        .values({
          name: parsed.data.name,
          type: parsed.data.type,
          countryCode: parsed.data.countryCode,
          registrationNumber: parsed.data.registrationNumber ?? null,
          createdBy: user.id,
        })
        .returning({ id: organisations.id });

      await transaction.insert(memberships).values({
        organisationId: created.id,
        userId: user.id,
        role: "organisation_owner",
        status: "active",
      });

      return created;
    },
  );

  redirect(`/dashboard?organisation=${organisation.id}`);
}
