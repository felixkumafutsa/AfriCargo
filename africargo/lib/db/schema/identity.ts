import {
  boolean,
  index,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const organisationType = pgEnum("organisation_type", [
  "freight_forwarder",
  "clearing_agent",
  "transporter",
  "integrated_logistics",
]);

export const countryCode = pgEnum("country_code", ["MW", "MZ", "ZM", "TZ"]);

export const membershipRole = pgEnum("membership_role", [
  "organisation_owner",
  "organisation_admin",
  "operations_manager",
  "clearing_agent",
  "freight_officer",
  "transport_manager",
  "driver",
  "finance_officer",
  "customer",
  "auditor",
]);

export const membershipStatus = pgEnum("membership_status", [
  "active",
  "invited",
  "suspended",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const organisations = pgTable(
  "organisations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: organisationType("type").notNull(),
    countryCode: countryCode("country_code").notNull(),
    registrationNumber: text("registration_number"),
    createdBy: uuid("created_by").notNull(),
    ...timestamps,
  },
  (table) => ({
    createdByIdx: index("organisations_created_by_idx").on(table.createdBy),
  }),
);

export const organisationBranches = pgTable(
  "organisation_branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    countryCode: countryCode("country_code").notNull(),
    address: text("address"),
    isHeadOffice: boolean("is_head_office").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    organisationIdx: index("organisation_branches_organisation_idx").on(
      table.organisationId,
    ),
    organisationIdUnique: uniqueIndex(
      "organisation_branches_organisation_id_unique",
    ).on(table.organisationId, table.id),
    nameUnique: uniqueIndex("organisation_branches_name_unique").on(
      table.organisationId,
      table.name,
    ),
  }),
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  ...timestamps,
});

export const platformAdmins = pgTable("platform_admins", {
  userId: uuid("user_id").primaryKey(),
  grantedBy: uuid("granted_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    branchId: uuid("branch_id"),
    role: membershipRole("role").notNull(),
    status: membershipStatus("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => ({
    userOrganisationUnique: uniqueIndex(
      "memberships_user_organisation_unique",
    ).on(table.userId, table.organisationId),
    organisationIdx: index("memberships_organisation_idx").on(
      table.organisationId,
    ),
    userIdx: index("memberships_user_idx").on(table.userId),
    branchOrganisationFk: foreignKey({
      columns: [table.organisationId, table.branchId],
      foreignColumns: [
        organisationBranches.organisationId,
        organisationBranches.id,
      ],
      name: "memberships_branch_same_organisation_fk",
    }),
  }),
);

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
});

export const roles = pgTable("roles", {
  code: membershipRole("code").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: membershipRole("role")
      .notNull()
      .references(() => roles.code, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex("role_permissions_role_permission").on(
      table.role,
      table.permissionId,
    ),
    roleIdx: index("role_permissions_role_idx").on(table.role),
  }),
);

export const organisationInvitations = pgTable(
  "organisation_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRole("role").notNull(),
    branchId: uuid("branch_id"),
    invitedBy: uuid("invited_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    organisationEmailIdx: index("organisation_invitations_email_idx").on(
      table.organisationId,
      table.email,
    ),
    pendingUnique: uniqueIndex("organisation_invitations_pending_unique")
      .on(table.organisationId, table.email)
      .where(sql`${table.acceptedAt} IS NULL`),
    branchOrganisationFk: foreignKey({
      columns: [table.organisationId, table.branchId],
      foreignColumns: [
        organisationBranches.organisationId,
        organisationBranches.id,
      ],
      name: "organisation_invitations_branch_same_organisation_fk",
    }),
  }),
);

export const identitySchema = {
  organisations,
  organisationBranches,
  userProfiles,
  platformAdmins,
  memberships,
  permissions,
  roles,
  rolePermissions,
  organisationInvitations,
};
