import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { scrapeGoogleMaps } from '@/lib/scraper';

const RATE_LIMIT_PER_DAY = 10;

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Connectez-vous pour lancer un scrape.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body.query ?? '').trim();
    const location = String(body.location ?? '').trim();
    const maxResults = Math.min(Math.max(Number(body.maxResults) || 100, 1), 500);

    if (!query || !location) {
      return NextResponse.json(
        { error: 'Champs requis : query, location' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const { count, error: countErr } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('scrape_date', `${today}T00:00:00.000Z`)
      .lt('scrape_date', `${today}T23:59:59.999Z`);

    if (countErr) {
      return NextResponse.json(
        { error: 'Erreur vérification quota.' },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
      return NextResponse.json(
        {
          error: `Quota gratuit atteint (${RATE_LIMIT_PER_DAY} scrapes/jour). Réessayez demain.`,
        },
        { status: 429 }
      );
    }

    const proxyUrl = process.env.PLAYWRIGHT_PROXY_URL;
    const data = await scrapeGoogleMaps({
      query,
      location,
      maxResults,
      proxyUrl,
    });

    const { data: row, error: insertErr } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        query,
        location,
        max_results: maxResults,
        data,
        scrape_date: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: 'Erreur sauvegarde des leads.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: row!.id, count: data.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Scrape failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
