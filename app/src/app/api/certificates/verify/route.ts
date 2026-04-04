import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do certificado é obrigatório' }, { status: 400 });
    }

    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
      .from('certificates')
      .select(
        `
          id,
          issued_at,
          profile_id,
          course_id,
          profiles(full_name),
          courses(title)
        `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Certificado não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        id: data.id,
        issued_at: data.issued_at,
        student: (data as any).profiles?.full_name || 'Aluno',
        course: (data as any).courses?.title || 'Curso',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao validar certificado' },
      { status: 500 },
    );
  }
}
