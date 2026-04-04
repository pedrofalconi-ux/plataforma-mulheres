import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const InstitutionalSchema = z.object({
  hero_title: z.string().min(8, 'Titulo principal muito curto').max(140),
  hero_subtitle: z.string().min(12, 'Subtitulo muito curto').max(280),
  about_summary: z.string().min(20, 'Resumo institucional muito curto').max(1200),
  mission: z.string().min(12, 'Missao muito curta').max(1200),
  vision: z.string().min(12, 'Visao muito curta').max(1200),
  values: z.array(z.string().min(2)).min(3).max(10),
});

const fallbackContent = {
  hero_title: 'Nathi Faria',
  hero_subtitle: 'Aprendizagem viva, casa com direcao e uma presenca mais intencional no cotidiano.',
  about_summary:
    'A plataforma conecta formacao, presenca e conteudo com uma linguagem mais serena, madura e feminina.',
  mission:
    'Cultivar jornadas de aprendizagem que fortalecam o lar, a presenca e a clareza na vida cotidiana.',
  vision:
    'Ser uma referencia em formacao feminina com estetica, profundidade e direcao.',
  values: ['Clareza', 'Cuidado', 'Presenca', 'Responsabilidade', 'Beleza'],
};

const institutionalMissingMessage =
  'Tabela public.institutional_content ausente no Supabase atual. Aplique a migration app/supabase/migrations/013_backend_compat_institutional.sql.';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role?.toLowerCase() !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }

  return { userId: user.id };
}

export async function GET() {
  try {
    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from('institutional_content')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      data || {
        id: true,
        ...fallbackContent,
      },
    );
  } catch (error: any) {
    const details = error?.message || 'Erro desconhecido';
    return NextResponse.json(
      {
        ...fallbackContent,
        warning: details.includes('institutional_content')
          ? institutionalMissingMessage
          : 'Falha ao carregar conteudo institucional do banco.',
        details,
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
        { error: 'Dados invalidos', details: error.flatten() },
        { status: 400 },
      );
    }

    const details = error?.message || 'Falha ao atualizar conteudo institucional';
    if (details.includes('institutional_content')) {
      return NextResponse.json(
        { error: institutionalMissingMessage, details },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: details }, { status: 500 });
  }
}
