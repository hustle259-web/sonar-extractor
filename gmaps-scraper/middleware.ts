import { NextResponse, type NextRequest } from 'next/server';

// Auth gérée par Neon (sessions en DB). Pas de refresh ici.
// et remplace par le middleware Supabase classique.
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
