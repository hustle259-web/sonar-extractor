import { NextResponse } from 'next/server';

/** Ancien callback OAuth Supabase. Redirige vers la home. */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
