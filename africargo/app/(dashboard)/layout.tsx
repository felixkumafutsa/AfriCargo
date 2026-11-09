import { Sidebar } from "@/components/dashboard/sidebar";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisations } from "@/lib/auth/organisations";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !process.env.AFRICARGO_DATABASE_URL
  ) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
        <div role="status" className="rounded-xl border border-surface-border bg-white p-6">
          <h1 className="text-xl font-semibold text-primary">Workspace setup required</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Configure Supabase Auth and the restricted AFRICARGO_DATABASE_URL runtime connection before opening the dashboard.
          </p>
        </div>
      </main>
    );
  }

  const user = await requireCurrentUser();
  const organisations = await getUserOrganisations(user.id, user.email);

  if (organisations.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-surface-subtle px-8 py-6">{children}</main>
    </div>
  );
}
