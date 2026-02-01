import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'gmaps_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function hasAccessCode() {
  const code = process.env.ACCESS_CODE;
  return typeof code === 'string' && code.trim() !== '';
}

function isValidCode(code: string): boolean {
  return code === process.env.ACCESS_CODE;
}

export async function GET() {
  if (!hasAccessCode()) {
    return NextResponse.json({ ok: true });
  }
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  const ok = cookie?.value === '1';
  return NextResponse.json({ ok: !!ok });
}

export async function POST(request: NextRequest) {
  if (!hasAccessCode()) {
    return NextResponse.json({ ok: true });
  }
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Code requis' }, { status: 400 });
  }
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Code requis' }, { status: 400 });
  }
  if (!isValidCode(code)) {
    return NextResponse.json({ ok: false, error: 'Code incorrect' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '1', {
    path: '/',
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
