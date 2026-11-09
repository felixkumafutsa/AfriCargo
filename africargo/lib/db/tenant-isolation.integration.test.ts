import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.AFRICARGO_TEST_DATABASE_URL;
const userA = process.env.TEST_TENANT_USER_A_ID;
const userB = process.env.TEST_TENANT_USER_B_ID;
const organisationA = process.env.TEST_TENANT_ORGANISATION_A_ID;
const organisationB = process.env.TEST_TENANT_ORGANISATION_B_ID;
const enabled = Boolean(
  databaseUrl && userA && userB && organisationA && organisationB,
);

describe.skipIf(!enabled)("tenant row-level security", () => {
  let client: ReturnType<typeof postgres>;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("AFRICARGO_TEST_DATABASE_URL is required for RLS integration tests.");
    }
    client = postgres(databaseUrl, { max: 1, prepare: false });
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });

  it("does not let an organisation A member read organisation B", async () => {
    if (!userA || !userB || !organisationA || !organisationB) {
      throw new Error("Tenant isolation test fixture IDs are required.");
    }

    await client.begin(async (transaction) => {
      await transaction`
        select set_config('request.jwt.claim.sub', ${userA}, true)
      `;
      await transaction`
        select set_config(
          'request.jwt.claims',
          ${JSON.stringify({ sub: userA, email: "tenant-a-test@example.invalid" })},
          true
        )
      `;

      const ownOrganisation = await transaction`
        select id from public.organisations where id = ${organisationA}
      `;
      const otherOrganisation = await transaction`
        select id from public.organisations where id = ${organisationB}
      `;

      expect(ownOrganisation).toHaveLength(1);
      expect(otherOrganisation).toHaveLength(0);

      await transaction`
        select set_config('request.jwt.claim.sub', ${userB}, true)
      `;
      await transaction`
        select set_config(
          'request.jwt.claims',
          ${JSON.stringify({ sub: userB, email: "tenant-b-test@example.invalid" })},
          true
        )
      `;
      const organisationBForItsMember = await transaction`
        select id from public.organisations where id = ${organisationB}
      `;
      expect(organisationBForItsMember).toHaveLength(1);
    });
  });
});
