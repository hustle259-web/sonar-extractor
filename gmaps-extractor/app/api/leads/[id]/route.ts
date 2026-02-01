import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Non authentifié.' },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Lead non trouvé.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
