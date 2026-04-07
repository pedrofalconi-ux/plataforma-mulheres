import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [{ data: regions, error: regionsError }, { data: skills, error: skillsError }] =
      await Promise.all([
        supabase.from('regions').select('id, name, state').order('name', { ascending: true }),
        supabase.from('skills').select('id, name').order('name', { ascending: true }),
      ]);

    if (regionsError || skillsError) {
      return NextResponse.json(
        { error: regionsError?.message || skillsError?.message || 'Erro ao carregar opções do perfil.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      regions: regions || [],
      skills: skills || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
