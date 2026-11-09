ALTER TABLE "memberships" DROP CONSTRAINT "memberships_branch_id_organisation_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "organisation_invitations" DROP CONSTRAINT "organisation_invitations_branch_id_organisation_branches_id_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "organisation_branches_organisation_id_unique" ON "organisation_branches" USING btree ("organisation_id","id");
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_branch_same_organisation_fk" FOREIGN KEY ("organisation_id","branch_id") REFERENCES "public"."organisation_branches"("organisation_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_invitations" ADD CONSTRAINT "organisation_invitations_branch_same_organisation_fk" FOREIGN KEY ("organisation_id","branch_id") REFERENCES "public"."organisation_branches"("organisation_id","id") ON DELETE no action ON UPDATE no action;