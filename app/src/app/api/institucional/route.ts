import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { emptyStringToNull, filterExistingColumns } from '@/lib/admin-api';

const InstitutionalSchema = z.object({
  hero_title: z.string().min(8, 'Título principal muito curto').max(140),
  hero_subtitle: z.string().min(12, 'Subtítulo muito curto').max(280),
  about_summary: z.string().min(20, 'Resumo institucional muito curto').max(1200),
  mission: z.string().min(12, 'Missão muito curta').max(1200),
  vision: z.string().min(12, 'Visão muito curta').max(1200),
  values: z.array(z.string().min(2)).min(3).max(10),
  whatsapp_group_url: z.string().url('Link do grupo de WhatsApp inválido').nullable().optional(),
});

const fallbackContent = {
  hero_title: 'Nathi Faria',
  hero_subtitle: 'Transformando a sua casa num lar.',
  about_summary:
    'O ambiente familiar da residência define o destino daqueles que ali moram.',
  mission:
    'Fortalecer atitudes e práticas que transformam a casa em um lar onde o coração se forma.',
  vision:
    'Ver mulheres construindo lares com sabedoria, entendimento e vínculos saudáveis.',
  values: ['Sabedoria', 'Entendimento', 'Vínculos', 'Cuidado', 'Propósito'],
  whatsapp_group_url: null,
};

const institutionalMissingMessage =
  'Tabela public.institutional_content ausente no Supabase atual. Aplique a migration app/supabase/migrations/013_backend_compat_institutional.sql.';

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
          : 'Falha ao carregar conteúdo institucional do banco.',
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
    const validated = InstitutionalSchema.parse({
      ...payload,
      whatsapp_group_url: emptyStringToNull(payload?.whatsapp_group_url),
    });

    const adminClient = await createAdminClient();
    const upsertData = await filterExistingColumns(adminClient, 'institutional_content', {
      id: true,
      ...validated,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    });

    const { data, error } = await adminClient
      .from('institutional_content')
      .upsert(upsertData, { onConflict: 'id' })
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

    const details = error?.message || 'Falha ao atualizar conteúdo institucional';
    if (details.includes('institutional_content')) {
      return NextResponse.json(
        { error: institutionalMissingMessage, details },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: details }, { status: 500 });
  }
}
