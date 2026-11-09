import { membershipRole } from "@/lib/db/schema";

export type MembershipRole = (typeof membershipRole.enumValues)[number];
export type Permission =
  | "organisation.manage"
  | "members.invite"
  | "dashboard.view";

const permissionsByRole: Record<MembershipRole, readonly Permission[]> = {
  organisation_owner: [
    "organisation.manage",
    "members.invite",
    "dashboard.view",
  ],
  organisation_admin: ["members.invite", "dashboard.view"],
  operations_manager: ["dashboard.view"],
  clearing_agent: ["dashboard.view"],
  freight_officer: ["dashboard.view"],
  transport_manager: ["dashboard.view"],
  driver: ["dashboard.view"],
  finance_officer: ["dashboard.view"],
  customer: ["dashboard.view"],
  auditor: ["dashboard.view"],
};

export function can(role: MembershipRole, permission: Permission) {
  return permissionsByRole[role].includes(permission);
}
