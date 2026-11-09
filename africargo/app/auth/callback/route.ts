import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Invalid+sign-in+link", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=Sign-in+link+expired", request.url));
  }

  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";
  const destination = new URL(safeNext, request.url);
  if (destination.origin !== request.nextUrl.origin) {
    destination.pathname = "/dashboard";
    destination.search = "";
    destination.hash = "";
  }

  return NextResponse.redirect(destination);
}
