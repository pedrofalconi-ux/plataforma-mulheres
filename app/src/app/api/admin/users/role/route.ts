import { NextResponse } from 'next/server';
import { logAuditEvent, requireAdmin } from '@/lib/admin-api';

export async function PATCH(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const body = await request.json();
    const profileId = String(body?.profileId || '').trim();
    const role = String(body?.role || '').trim().toLowerCase();

    if (!profileId) {
      return NextResponse.json({ error: 'Perfil não informado.' }, { status: 400 });
    }

    if (!['admin', 'student'].includes(role)) {
      return NextResponse.json({ error: 'Papel invalido.' }, { status: 400 });
    }

    if (profileId === adminContext.user.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'Não é permitido remover seu próprio acesso de administradora por aqui.' },
        { status: 400 }
      );
    }

    const { data: previousProfile, error: previousError } = await adminContext.adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', profileId)
      .single();

    if (previousError || !previousProfile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const { data: updatedProfile, error: updateError } = await adminContext.adminClient
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select('id, full_name, email, role')
      .single();

    if (updateError || !updatedProfile) {
      throw updateError || new Error('Falha ao atualizar o papel da usuaria.');
    }

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: role === 'admin' ? 'PROMOTE_ADMIN' : 'REMOVE_ADMIN',
      entityName: 'profiles',
      entityId: profileId,
      oldValue: previousProfile,
      newValue: updatedProfile,
      request,
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno.' }, { status: 500 });
  }
}
