import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getPromoCodes, addPromoCode } from '@/lib/db';

function isAdmin(email: string): boolean {
  const admins = (process.env.ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const user = await getSessionFromCookies();
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!user) {
      return NextResponse.json({ error: 'Accès refusé. Connectez-vous d\'abord.' }, { status: 403 });
    }
    // En dev : si ADMIN_EMAIL non chargé, autoriser tout utilisateur connecté
    const isDev = process.env.NODE_ENV === 'development';
    if (adminEmails.length === 0) {
      if (isDev) {
        console.warn('ADMIN_EMAIL non configuré — accès admin autorisé en dev pour', user.email);
      } else {
        return NextResponse.json({
          error: 'ADMIN_EMAIL non configuré. Ajoute ADMIN_EMAIL dans les variables d\'environnement Vercel.',
        }, { status: 403 });
      }
    } else if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({
        error: `Accès refusé. Ton email (${user.email}) n'est pas dans ADMIN_EMAIL.`,
      }, { status: 403 });
    }
    const codes = await getPromoCodes();
    return NextResponse.json({ codes });
  } catch (e) {
    console.error('Admin promo GET error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookies();
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!user) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    const allowed = adminEmails.length === 0 && process.env.NODE_ENV === 'development'
      ? true
      : adminEmails.includes(user.email.toLowerCase());
    if (!allowed) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) {
      return NextResponse.json({ error: 'Code requis.' }, { status: 400 });
    }
    await addPromoCode(code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Ce code existe déjà.' }, { status: 400 });
    }
    console.error('Admin promo POST error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
