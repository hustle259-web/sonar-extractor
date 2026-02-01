import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { setUnlimitedPromo, getUser, isValidPromoCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Connectez-vous pour utiliser un code promo.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code) {
      return NextResponse.json({ error: 'Code promo requis.' }, { status: 400 });
    }

    if (!(await isValidPromoCode(code))) {
      return NextResponse.json({ error: 'Code promo invalide.' }, { status: 400 });
    }

    const dbUser = await getUser(user.id);
    if (dbUser?.unlimited_promo) {
      return NextResponse.json({ ok: true, message: 'Accès illimité déjà actif.' });
    }

    await setUnlimitedPromo(user.id);
    return NextResponse.json({ ok: true, message: 'Code accepté ! Accès illimité activé.' });
  } catch (e) {
    console.error('Promo redeem error:', e);
    return NextResponse.json({ error: 'Erreur lors de l\'activation du code.' }, { status: 500 });
  }
}
