DO $$
BEGIN
  CREATE ROLE africargo_runtime LOGIN NOSUPERUSER NOBYPASSRLS;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint
ALTER ROLE africargo_runtime LOGIN NOSUPERUSER NOBYPASSRLS;
--> statement-breakpoint
ALTER TABLE public.organisations
  ADD CONSTRAINT organisations_created_by_auth_user_fk
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_user_auth_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE public.organisation_invitations
  ADD CONSTRAINT organisation_invitations_invited_by_auth_user_fk
  FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_auth_user_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER organisations_set_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER organisation_branches_set_updated_at
BEFORE UPDATE ON public.organisation_branches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER memberships_set_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER organisation_invitations_set_updated_at
BEFORE UPDATE ON public.organisation_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'New user'),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_organisation_member(target_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS membership
    WHERE membership.organisation_id = target_organisation_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_organisation_admin(target_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS membership
    WHERE membership.organisation_id = target_organisation_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
      AND membership.role IN ('organisation_owner', 'organisation_admin')
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.is_organisation_owner(target_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS membership
    WHERE membership.organisation_id = target_organisation_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
      AND membership.role = 'organisation_owner'
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.shares_organisation_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS own_membership
    INNER JOIN public.memberships AS other_membership
      ON other_membership.organisation_id = own_membership.organisation_id
    WHERE own_membership.user_id = auth.uid()
      AND own_membership.status = 'active'
      AND other_membership.user_id = target_user_id
      AND other_membership.status = 'active'
  );
$$;
--> statement-breakpoint
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_branches FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_invitations FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY organisations_select ON public.organisations
  FOR SELECT TO africargo_runtime
  USING (public.is_organisation_member(id) OR created_by = auth.uid());
CREATE POLICY organisations_insert ON public.organisations
  FOR INSERT TO africargo_runtime
  WITH CHECK (created_by = auth.uid());
CREATE POLICY organisations_update ON public.organisations
  FOR UPDATE TO africargo_runtime
  USING (public.is_organisation_admin(id))
  WITH CHECK (public.is_organisation_admin(id));
--> statement-breakpoint
CREATE POLICY organisation_branches_select ON public.organisation_branches
  FOR SELECT TO africargo_runtime
  USING (public.is_organisation_member(organisation_id));
CREATE POLICY organisation_branches_insert ON public.organisation_branches
  FOR INSERT TO africargo_runtime
  WITH CHECK (public.is_organisation_admin(organisation_id));
CREATE POLICY organisation_branches_update ON public.organisation_branches
  FOR UPDATE TO africargo_runtime
  USING (public.is_organisation_admin(organisation_id))
  WITH CHECK (public.is_organisation_admin(organisation_id));
CREATE POLICY organisation_branches_delete ON public.organisation_branches
  FOR DELETE TO africargo_runtime
  USING (public.is_organisation_admin(organisation_id));
--> statement-breakpoint
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT TO africargo_runtime
  USING (id = auth.uid() OR public.shares_organisation_with(id));
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT TO africargo_runtime
  USING (user_id = auth.uid() OR public.is_organisation_admin(organisation_id));
CREATE POLICY memberships_insert ON public.memberships
  FOR INSERT TO africargo_runtime
  WITH CHECK (
    (
      user_id = auth.uid()
      AND role = 'organisation_owner'
      AND EXISTS (
        SELECT 1 FROM public.organisations AS organisation
        WHERE organisation.id = organisation_id
          AND organisation.created_by = auth.uid()
      )
    )
    OR
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.organisation_invitations AS invitation
        WHERE invitation.organisation_id = organisation_id
          AND invitation.role = role
          AND lower(invitation.email) = lower(auth.jwt() ->> 'email')
          AND invitation.accepted_at IS NULL
          AND invitation.expires_at > now()
      )
    )
  );
CREATE POLICY memberships_update ON public.memberships
  FOR UPDATE TO africargo_runtime
  USING (public.is_organisation_owner(organisation_id))
  WITH CHECK (public.is_organisation_owner(organisation_id));
--> statement-breakpoint
CREATE POLICY permissions_select ON public.permissions
  FOR SELECT TO africargo_runtime
  USING (auth.uid() IS NOT NULL);
CREATE POLICY role_permissions_select ON public.role_permissions
  FOR SELECT TO africargo_runtime
  USING (auth.uid() IS NOT NULL);
--> statement-breakpoint
CREATE POLICY organisation_invitations_select ON public.organisation_invitations
  FOR SELECT TO africargo_runtime
  USING (
    public.is_organisation_admin(organisation_id)
    OR lower(email) = lower(auth.jwt() ->> 'email')
  );
CREATE POLICY organisation_invitations_insert ON public.organisation_invitations
  FOR INSERT TO africargo_runtime
  WITH CHECK (
    public.is_organisation_admin(organisation_id)
    AND invited_by = auth.uid()
    AND role <> 'organisation_owner'
  );
CREATE POLICY organisation_invitations_update ON public.organisation_invitations
  FOR UPDATE TO africargo_runtime
  USING (
    public.is_organisation_admin(organisation_id)
    OR (
      lower(email) = lower(auth.jwt() ->> 'email')
      AND accepted_at IS NULL
    )
  )
  WITH CHECK (
    public.is_organisation_admin(organisation_id)
    OR (
      lower(email) = lower(auth.jwt() ->> 'email')
      AND accepted_at IS NOT NULL
    )
  );
CREATE POLICY organisation_invitations_delete ON public.organisation_invitations
  FOR DELETE TO africargo_runtime
  USING (public.is_organisation_admin(organisation_id));
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.is_organisation_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_organisation_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_organisation_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shares_organisation_with(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_organisation_member(uuid) TO africargo_runtime;
GRANT EXECUTE ON FUNCTION public.is_organisation_admin(uuid) TO africargo_runtime;
GRANT EXECUTE ON FUNCTION public.is_organisation_owner(uuid) TO africargo_runtime;
GRANT EXECUTE ON FUNCTION public.shares_organisation_with(uuid) TO africargo_runtime;
GRANT USAGE ON SCHEMA public, auth TO africargo_runtime;
GRANT EXECUTE ON FUNCTION auth.uid() TO africargo_runtime;
GRANT EXECUTE ON FUNCTION auth.jwt() TO africargo_runtime;
GRANT USAGE ON TYPE public.country_code, public.membership_role,
  public.membership_status, public.organisation_type TO africargo_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.organisations, public.organisation_branches, public.user_profiles,
     public.memberships, public.permissions, public.role_permissions,
     public.organisation_invitations
  TO africargo_runtime;
--> statement-breakpoint
INSERT INTO public.permissions (code, description)
VALUES
  ('organisation.manage', 'Manage organisation settings'),
  ('members.invite', 'Invite and manage organisation members'),
  ('dashboard.view', 'View the organisation dashboard')
ON CONFLICT (code) DO NOTHING;
--> statement-breakpoint
INSERT INTO public.role_permissions (role, permission_id)
SELECT role_values.role::public.membership_role, permissions.id
FROM (
  VALUES
    ('organisation_owner', 'organisation.manage'),
    ('organisation_owner', 'members.invite'),
    ('organisation_owner', 'dashboard.view'),
    ('organisation_admin', 'members.invite'),
    ('organisation_admin', 'dashboard.view'),
    ('operations_manager', 'dashboard.view'),
    ('clearing_agent', 'dashboard.view'),
    ('freight_officer', 'dashboard.view'),
    ('transport_manager', 'dashboard.view'),
    ('driver', 'dashboard.view'),
    ('finance_officer', 'dashboard.view'),
    ('customer', 'dashboard.view'),
    ('auditor', 'dashboard.view')
) AS role_values(role, permission_code)
INNER JOIN public.permissions ON permissions.code = role_values.permission_code
ON CONFLICT DO NOTHING;