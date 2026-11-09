CREATE TABLE "platform_admins" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"granted_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE public.platform_admins
  ADD CONSTRAINT platform_admins_user_auth_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE public.platform_admins
  ADD CONSTRAINT platform_admins_granted_by_auth_user_fk
  FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY platform_admins_select_self ON public.platform_admins
  FOR SELECT TO africargo_runtime
  USING (user_id = auth.uid());
--> statement-breakpoint
GRANT SELECT ON public.platform_admins TO africargo_runtime;
