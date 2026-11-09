CREATE TABLE "roles" (
	"code" "membership_role" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
INSERT INTO public.roles (code, name, description)
VALUES
  ('organisation_owner', 'Organisation Owner', 'Owns and manages an organisation workspace'),
  ('organisation_admin', 'Organisation Admin', 'Manages organisation members and operations'),
  ('operations_manager', 'Operations Manager', 'Coordinates organisation operations'),
  ('clearing_agent', 'Clearing Agent', 'Manages customs clearance work'),
  ('freight_officer', 'Freight Officer', 'Coordinates freight operations'),
  ('transport_manager', 'Transport Manager', 'Manages fleet and transport operations'),
  ('driver', 'Driver', 'Performs assigned transport work'),
  ('finance_officer', 'Finance Officer', 'Manages financial operations'),
  ('customer', 'Customer', 'Views customer-authorised operations'),
  ('auditor', 'Auditor', 'Views permitted records for audit purposes')
ON CONFLICT (code) DO NOTHING;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_roles_code_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO africargo_runtime
  USING (auth.uid() IS NOT NULL);
--> statement-breakpoint
GRANT SELECT ON public.roles TO africargo_runtime;