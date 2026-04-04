import { NextResponse } from 'next/server';
import { CreateModuleSchema, UpdateModuleSchema } from '@/lib/schemas';
import { logAuditEvent, requireAdmin, sanitizeText } from '@/lib/admin-api';

export async function POST(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const payload = await request.json();
    const parsed = CreateModuleSchema.safeParse({
      ...payload,
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await adminContext.adminClient
      .from('modules')
      .insert(parsed.data)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar mÃ³dulo');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'CREATE_MODULE',
      entityName: 'modules',
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
    const parsed = UpdateModuleSchema.safeParse({
      ...payload,
      title: sanitizeText(payload.title),
      description: sanitizeText(payload.description),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const { data: previous } = await adminContext.adminClient
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await adminContext.adminClient
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao atualizar mÃ³dulo');

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'UPDATE_MODULE',
      entityName: 'modules',
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
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await adminContext.adminClient.from('modules').delete().eq('id', id);
    if (error) throw error;

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'DELETE_MODULE',
      entityName: 'modules',
      entityId: id,
      oldValue: previous,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
