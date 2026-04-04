import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const InstitutionalSchema = z.object({
  hero_title: z.string().min(8, 'Título principal muito curto').max(140),
  hero_subtitle: z.string().min(12, 'Subtítulo muito curto').max(280),
  about_summary: z.string().min(20, 'Resumo institucional muito curto').max(1200),
  mission: z.string().min(12, 'Missão muito curta').max(1200),
  vision: z.string().min(12, 'Visão muito curta').max(1200),
  values: z.array(z.string().min(2)).min(3).max(10),
});

const fallbackContent = {
  hero_title: 'Ecossistema da Dignidade',
  hero_subtitle: 'Educação, comunidade e iniciativas sociais em um único lugar.',
  about_summary:
    'A plataforma conecta formação, participação comunitária e impacto social com foco na dignidade humana.',
  mission:
    'Fortalecer a dignidade humana por meio da educação, da ação social e da integração comunitária.',
  vision:
    'Ser referência em soberania digital para comunidades e iniciativas solidárias.',
  values: ['Verdade', 'Solidariedade', 'Responsabilidade', 'Excelência', 'Acolhimento'],
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  return { userId: user.id };
}

export async function GET() {
  try {
    const adminClient = await createAdminClient();
    const { data } = await adminClient
      .from('institutional_content')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    return NextResponse.json(
      data || {
        id: true,
        ...fallbackContent,
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ...fallbackContent,
        warning: 'Falha ao carregar conteúdo institucional do banco.',
        details: error?.message || 'Erro desconhecido',
      },
      { status: 200 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const payload = await request.json();
    const validated = InstitutionalSchema.parse(payload);

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from('institutional_content')
      .upsert(
        {
          id: true,
          ...validated,
          updated_by: auth.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error?.message || 'Falha ao atualizar conteúdo institucional' },
      { status: 500 },
    );
  }
}
