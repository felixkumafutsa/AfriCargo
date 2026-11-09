import { Building2, Globe2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: ShieldCheck, label: "Secure workspaces" },
  { icon: Users, label: "Role-based access" },
  { icon: Globe2, label: "Regional setup" },
  { icon: Building2, label: "Team invitations" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="text-xl font-bold text-primary">
          Afri<span className="text-accent">Cargo</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink md:flex">
          <a href="#home" className="text-accent">Home</a>
          <a href="#features">Features</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-ink">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-5xl font-extrabold leading-tight text-primary">
            Moving Africa,
            <br />
            <span className="text-accent">Digitally.</span>
          </h1>
          <p className="mt-5 max-w-md text-ink-muted">
            AfriCargo is building a secure workspace for freight, customs,
            transport, and logistics teams operating across Southern and East
            Africa.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-base font-medium text-white transition-colors hover:bg-accent-dark"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-surface-border bg-white px-6 text-base font-medium text-ink transition-colors hover:bg-surface-subtle"
            >
              Log in
            </Link>
          </div>

          <div id="features" className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-start gap-2">
                <Icon className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-ink-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status card echoing the mockup's floating status widget */}
        <div className="relative rounded-2xl bg-primary p-8">
          <div className="rounded-xl bg-white p-5 shadow-card">
            <p className="text-xs font-medium text-ink-muted">Illustrative workflow</p>
            <p className="mt-1 text-lg font-semibold text-accent">In Transit</p>
            <p className="mt-3 text-sm text-ink">Origin → Destination</p>
            <p className="text-xs text-ink-muted">Example milestone tracking, not live shipment data</p>
          </div>
        </div>
      </section>
    </div>
  );
}
