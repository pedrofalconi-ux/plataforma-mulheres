import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient as createSupabaseClient } from '@/lib/supabase/server';

const nullableText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().min(1).nullable().optional());

const nullableUrl = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().url('URL inválida').nullable().optional());

const nullablePositiveInt = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().int().positive('A capacidade deve ser maior que zero').nullable().optional());

const EventCreateSchema = z.object({
  title: z.string().trim().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: nullableText,
  start_at: z.string().trim().min(1, 'A data de início é obrigatória'),
  end_at: nullableText,
  location: nullableText,
  is_online: z.boolean(),
  stream_url: nullableUrl,
  max_attendees: nullablePositiveInt,
});

const EventUpdateSchema = EventCreateSchema.partial().extend({
  id: z.string().uuid('ID do evento inválido'),
});

type EventRecord = {
  title?: string;
  description?: string | null;
  start_at?: string;
  end_at?: string | null;
  location?: string | null;
  is_online?: boolean;
  stream_url?: string | null;
  max_attendees?: number | null;
};

async function requireAdmin() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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

function parseDateOrThrow(value: string, fieldLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida em ${fieldLabel}.`);
  }
  return date.toISOString();
}

function buildEventPayload(input: EventRecord) {
  if (!input.title || !input.start_at) {
    throw new Error('Título e data de início são obrigatórios.');
  }

  const start_at = parseDateOrThrow(input.start_at, 'data de início');
  const end_at = input.end_at ? parseDateOrThrow(input.end_at, 'data de término') : null;

  if (end_at && new Date(end_at) < new Date(start_at)) {
    throw new Error('A data de término deve ser posterior à data de início.');
  }

  return {
    title: input.title.trim(),
    description: input.description ?? null,
    start_at,
    end_at,
    location: input.location ?? null,
    is_online: Boolean(input.is_online),
    stream_url: input.stream_url ?? null,
    max_attendees: input.max_attendees ?? null,
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from('events')
      .select('*')
      .order('start_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao carregar eventos' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const adminClient = await createAdminClient();
    const body = await request.json();
    const parsed = EventCreateSchema.parse(body);
    const payload = buildEventPayload(parsed);

    const { data, error } = await adminClient
      .from('events')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || 'Falha ao criar evento' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const adminClient = await createAdminClient();
    const body = await request.json();
    const parsed = EventUpdateSchema.parse(body);
    const { id, ...updates } = parsed;

    const { data: existing, error: fetchError } = await adminClient
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const payload = buildEventPayload({
      ...existing,
      ...updates,
    });

    const { data, error } = await adminClient
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || 'Falha ao atualizar evento' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const adminClient = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao excluir evento' },
      { status: 500 },
    );
  }
}
