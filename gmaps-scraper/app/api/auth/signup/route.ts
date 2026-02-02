import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import { getUserByEmail, createUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL manquant. Vérifie gmaps-scraper/.env.local et relance le serveur.' },
        { status: 500 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email. Connectez-vous.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = await createUser(email, passwordHash, fullName || undefined);
    const token = await createSession(userId);

    const res = NextResponse.json({ ok: true, user_id: userId });
    res.cookies.set(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Signup error:', e);
    const isDev = process.env.NODE_ENV === 'development';
    // Détecter les erreurs de schéma DB courantes
    const isSchemaError = /unlimited_promo|relation "users"|relation "sessions"/i.test(msg);
    const hint = isSchemaError
      ? ' Exécute neon/schema.sql (ou migration-promo.sql) dans Neon Console > SQL Editor.'
      : '';
    return NextResponse.json(
      { error: isDev ? `Erreur: ${msg}${hint}` : `Erreur lors de l'inscription.${hint}` },
      { status: 500 }
    );
  }
}
