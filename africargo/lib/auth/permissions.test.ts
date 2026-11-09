import { describe, expect, it } from "vitest";

import { can } from "@/lib/auth/permissions";
import { membershipRole } from "@/lib/db/schema";

describe("organisation permissions", () => {
  it("allows only the owner to manage organisation settings", () => {
    for (const role of membershipRole.enumValues) {
      expect(can(role, "organisation.manage")).toBe(
        role === "organisation_owner",
      );
    }
  });

  it("allows owners and organisation admins to invite members", () => {
    for (const role of membershipRole.enumValues) {
      expect(can(role, "members.invite")).toBe(
        role === "organisation_owner" || role === "organisation_admin",
      );
    }
  });
});
