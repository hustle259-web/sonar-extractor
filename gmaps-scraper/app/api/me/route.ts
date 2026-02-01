import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getUsage, getCredits } from '@/lib/db';
import { PLANS, type PlanId } from '@/lib/plans';

function period(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function GET() {
  try {
    const user = await getSessionFromCookies();
    if (!user) {
      return NextResponse.json({ user: null, profile: null, usage: null, credits: null, scrapsLeft: 0, unlimitedPromo: false });
    }

    const unlimitedPromo = !!user.unlimited_promo;

    if (unlimitedPromo) {
      return NextResponse.json({
        user: { id: user.id, email: user.email },
        profile: { id: user.id, email: user.email, full_name: user.full_name, plan: user.plan, stripe_customer_id: user.stripe_customer_id },
        usage: { period: period(), scrapsUsed: 0, monthlyQuota: null, monthlyLeft: null, creditsTotal: 0 },
        scrapsLeft: 'unlimited',
        unlimitedPromo: true,
      });
    }

    const planId = (user.plan as PlanId) || 'free';
    const plan = PLANS[planId];
    const p = period();

    const usageRow = await getUsage(user.id, p);
    const monthlyUsed = usageRow?.scraps_used ?? 0;
    const monthlyQuota = plan.scrapsPerMonth;
    const monthlyLeft = Math.max(0, monthlyQuota - monthlyUsed);

    const creditRows = await getCredits(user.id);
    const creditsTotal = creditRows.reduce((s, r) => s + r.scraps_remaining, 0);
    const scrapsLeft = monthlyLeft + creditsTotal;

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile: { id: user.id, email: user.email, full_name: user.full_name, plan: user.plan, stripe_customer_id: user.stripe_customer_id },
      usage: { period: p, scrapsUsed: monthlyUsed, monthlyQuota, monthlyLeft, creditsTotal },
      scrapsLeft,
      unlimitedPromo: false,
    });
  } catch (e) {
    console.error('Me API error:', e);
    return NextResponse.json({ user: null, profile: null, usage: null, credits: null, scrapsLeft: 0, unlimitedPromo: false });
  }
}
