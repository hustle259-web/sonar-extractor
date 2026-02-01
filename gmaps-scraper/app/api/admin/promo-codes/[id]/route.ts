import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { togglePromoCode, deletePromoCode } from '@/lib/db';

function canAccessAdmin(user: { email: string } | null): boolean {
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (admins.length === 0 && process.env.NODE_ENV === 'development') return true;
  return admins.includes(user.email.toLowerCase());
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookies();
    if (!user || !canAccessAdmin(user)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }
    const { id } = await params;
    const body = await _request.json().catch(() => ({}));
    const active = body.active === true;
    await togglePromoCode(id, active);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin promo PATCH error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookies();
    if (!user || !canAccessAdmin(user)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }
    const { id } = await params;
    await deletePromoCode(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin promo DELETE error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
