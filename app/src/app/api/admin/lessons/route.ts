import { NextResponse } from 'next/server';
import { CreateLessonSchema, UpdateLessonSchema } from '@/lib/schemas';
import { filterExistingColumns, logAuditEvent, requireAdmin, sanitizeHtml, sanitizeText } from '@/lib/admin-api';

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function extractYouTubeVideoId(url: string | null | undefined) {
  if (!url) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function getYouTubeDurationMinutes(url: string | null | undefined) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DignareBot/1.0)',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const html = await response.text();
  const secondMatches = Array.from(html.matchAll(/"lengthSeconds":"(\d+)"/g))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);
  const milliMatches = Array.from(html.matchAll(/"approxDurationMs":"(\d+)"/g))
    .map((match) => Math.round(Number(match[1]) / 1000))
    .filter((value) => Number.isFinite(value) && value > 0);
  const durationCandidates = [...secondMatches, ...milliMatches];
  if (durationCandidates.length === 0) return null;

  const seconds = Math.max(...durationCandidates);
  return Math.max(1, Math.ceil(seconds / 60));
}

async function resolveDurationMinutes(payload: Record<string, unknown>) {
  const currentDuration = typeof payload.duration_minutes === 'number'
    ? payload.duration_minutes
    : Number(payload.duration_minutes || 0);

  const autoDetectedDuration = await getYouTubeDurationMinutes(
    typeof payload.content_url === 'string' ? payload.content_url : null
  );

  if (autoDetectedDuration) return autoDetectedDuration;
  return Number.isFinite(currentDuration) ? currentDuration : 0;
}

function sanitizeMaterials(materials: unknown) {
  if (!Array.isArray(materials)) return materials;

  return materials
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const material = item as Record<string, unknown>;

      return {
        title: sanitizeText(typeof material.title === 'string' ? material.title : ''),
        url: sanitizeText(typeof material.url === 'string' ? material.url : ''),
        kind: sanitizeText(typeof material.kind === 'string' ? material.kind : 'link'),
      };
    })
    .filter((item): item is { title: string; url: string; kind: string } => Boolean(item?.title) && Boolean(item?.url));
}

function sanitizeActivityQuestions(questions: unknown) {
  if (!Array.isArray(questions)) return questions;

  return questions
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const question = item as Record<string, unknown>;

      return {
        prompt: sanitizeText(typeof question.prompt === 'string' ? question.prompt : ''),
      };
    })
    .filter((item): item is { prompt: string } => Boolean(item?.prompt));
}

export async function POST(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const payload = await request.json();
    const parsed = CreateLessonSchema.safeParse({
      ...payload,
      duration_minutes: await resolveDurationMinutes(payload),
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
      content_url: sanitizeText(payload.content_url),
      content_text: sanitizeHtml(payload.content_text),
      materials: sanitizeMaterials(payload.materials),
      activity_questions: sanitizeActivityQuestions(payload.activity_questions),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const safeInsertData = await filterExistingColumns(adminContext.adminClient, 'lessons', parsed.data);

    const { data, error } = await adminContext.adminClient
      .from('lessons')
      .insert(safeInsertData)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar aula');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'CREATE_LESSON',
      entityName: 'lessons',
      entityId: data.id,
      newValue: data,
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const payload = await request.json();
    const parsed = UpdateLessonSchema.safeParse({
      ...payload,
      duration_minutes: await resolveDurationMinutes(payload),
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
      content_url: sanitizeText(payload.content_url),
      content_text: sanitizeHtml(payload.content_text),
      materials: sanitizeMaterials(payload.materials),
      activity_questions: sanitizeActivityQuestions(payload.activity_questions),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const { data: previous } = await adminContext.adminClient
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    const safeUpdateData = await filterExistingColumns(adminContext.adminClient, 'lessons', updateData);

    const { data, error } = await adminContext.adminClient
      .from('lessons')
      .update(safeUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao atualizar aula');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'UPDATE_LESSON',
      entityName: 'lessons',
      entityId: id,
      oldValue: previous,
      newValue: data,
      request,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatÃ³rio' }, { status: 400 });
    }

    const { data: previous } = await adminContext.adminClient
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await adminContext.adminClient.from('lessons').delete().eq('id', id);
    if (error) throw error;

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'DELETE_LESSON',
      entityName: 'lessons',
      entityId: id,
      oldValue: previous,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
