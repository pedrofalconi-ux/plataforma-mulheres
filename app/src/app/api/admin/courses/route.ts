import { NextResponse } from 'next/server';
import { CreateCourseSchema, UpdateCourseSchema } from '@/lib/schemas';
import { emptyStringToNull, filterExistingColumns, logAuditEvent, requireAdmin, sanitizeText } from '@/lib/admin-api';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function POST(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const payload = await request.json();
    const parsed = CreateCourseSchema.safeParse({
      ...payload,
      title: sanitizeText(payload.title),
      description: emptyStringToNull(sanitizeText(payload.description)),
      level: sanitizeText(payload.level),
      thumbnail_url: emptyStringToNull(sanitizeText(payload.thumbnail_url)),
      instructor_name: emptyStringToNull(sanitizeText(payload.instructor_name)),
      instructor_description: emptyStringToNull(sanitizeText(payload.instructor_description)),
      instructor_avatar_url: emptyStringToNull(sanitizeText(payload.instructor_avatar_url)),
      benefits: Array.isArray(payload.benefits)
        ? payload.benefits.map((benefit: unknown) => sanitizeText(String(benefit))).filter(Boolean)
        : payload.benefits,
    });

    if (!parsed.success) {
      console.error('Course Creation Validation Error:', JSON.stringify(parsed.error.flatten(), null, 2));
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slug = `${slugify(parsed.data.title)}-${Math.random().toString(36).substring(2, 7)}`;

    const insertData = await filterExistingColumns(adminContext.adminClient, 'courses', {
      ...parsed.data,
      slug,
      created_by: adminContext.user.id,
    });

    const { data, error } = await adminContext.adminClient
      .from('courses')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar curso');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'CREATE_COURSE',
      entityName: 'courses',
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
    const parsed = UpdateCourseSchema.safeParse({
      ...payload,
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
      level: sanitizeText(payload.level),
      thumbnail_url: emptyStringToNull(sanitizeText(payload.thumbnail_url)),
      instructor_name: emptyStringToNull(sanitizeText(payload.instructor_name)),
      instructor_description: emptyStringToNull(sanitizeText(payload.instructor_description)),
      instructor_avatar_url: emptyStringToNull(sanitizeText(payload.instructor_avatar_url)),
      benefits: Array.isArray(payload.benefits)
        ? payload.benefits.map((benefit: unknown) => sanitizeText(String(benefit))).filter(Boolean)
        : payload.benefits,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const { data: previous } = await adminContext.adminClient
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    const filteredUpdateData = await filterExistingColumns(adminContext.adminClient, 'courses', updateData);

    const { data, error } = await adminContext.adminClient
      .from('courses')
      .update(filteredUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao atualizar curso');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'UPDATE_COURSE',
      entityName: 'courses',
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
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await adminContext.adminClient.from('courses').delete().eq('id', id);
    if (error) throw error;

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'DELETE_COURSE',
      entityName: 'courses',
      entityId: id,
      oldValue: previous,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
