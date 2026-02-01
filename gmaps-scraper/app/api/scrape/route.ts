import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getUser, getUsage, getCredits, incrementUsage, deductCredit, insertScrape } from '@/lib/db';
import { searchPlaces } from '@/lib/places-api';
import { PLANS, type PlanId } from '@/lib/plans';

function period(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: 'Connectez-vous pour extraire des leads.', leads: [] },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const query = formData.get('query') as string;
    const location = formData.get('location') as string;
    const maxResults = Math.min(
      Math.max(parseInt(formData.get('maxResults') as string) || 20, 1),
      60
    );

    if (!query || !location) {
      return NextResponse.json(
        { error: 'Query et location sont requis', leads: [] },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_PLACES_API_KEY manquante.', leads: [] },
        { status: 500 }
      );
    }

    const dbUser = await getUser(user.id);
    const unlimitedPromo = !!dbUser?.unlimited_promo;

    if (!unlimitedPromo) {
      const planId = (dbUser?.plan as PlanId) || 'free';
      const plan = PLANS[planId];
      const p = period();

      const usageRow = await getUsage(user.id, p);
      const monthlyUsed = usageRow?.scraps_used ?? 0;
      const monthlyQuota = plan.scrapsPerMonth;
      const monthlyLeft = Math.max(0, monthlyQuota - monthlyUsed);

      const creditRows = await getCredits(user.id);
      const creditsTotal = creditRows.reduce((s, r) => s + r.scraps_remaining, 0);
      const scrapsLeft = monthlyLeft + creditsTotal;

      if (scrapsLeft < 1) {
        return NextResponse.json(
          { error: 'Plus de scraps disponibles. Passez à un plan supérieur ou achetez des crédits.', leads: [] },
          { status: 402 }
        );
      }

      const referer = request.headers.get('referer') || request.headers.get('origin') || undefined;
      const places = await searchPlaces(query, location, maxResults, referer);

      const leads = places.map((place) => ({
        name: place.name,
        address: place.address,
        phone: place.phone,
        site: place.website || '',
        rating: place.rating?.toString() ?? '',
        reviewCount: place.reviewCount ?? null,
        mapsUrl: place.mapsUrl || '',
      }));

      if (monthlyLeft >= 1) {
        await incrementUsage(user.id, p);
      } else {
        let toConsume = 1;
        for (const row of creditRows) {
          if (toConsume <= 0) break;
          const deduct = Math.min(toConsume, row.scraps_remaining);
          await deductCredit(row.id, deduct);
          toConsume -= deduct;
        }
      }

      await insertScrape(user.id, query, location, leads.length);
      return NextResponse.json(leads);
    }

    const referer = request.headers.get('referer') || request.headers.get('origin') || undefined;
    const places = await searchPlaces(query, location, maxResults, referer);

    const leads = places.map((place) => ({
      name: place.name,
      address: place.address,
      phone: place.phone,
      site: place.website || '',
      rating: place.rating?.toString() ?? '',
      reviewCount: place.reviewCount ?? null,
      mapsUrl: place.mapsUrl || '',
    }));

    await insertScrape(user.id, query, location, leads.length);

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Scrape error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: msg.includes('Google Places') ? `Google Places: ${msg}` : `Scraping échoué: ${msg}`, leads: [] },
      { status: 500 }
    );
  }
}
