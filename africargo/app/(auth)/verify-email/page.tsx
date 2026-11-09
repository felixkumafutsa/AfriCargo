import { Card } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <h1 className="text-xl font-semibold text-primary">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Follow the verification link we sent before signing in and setting up your organisation.
        </p>
      </Card>
    </main>
  );
}
