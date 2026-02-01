import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const token = await createSession(user.id);

    const res = NextResponse.json({ ok: true, user_id: user.id });
    res.cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Erreur lors de la connexion' }, { status: 500 });
  }
}
