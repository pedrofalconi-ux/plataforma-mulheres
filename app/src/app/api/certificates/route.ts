import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId) return NextResponse.json({ error: 'Course ID missing' }, { status: 400 });

    const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });

    // Validate enrollment progress
    const { data: enrollment, error: enrollErr } = await supabase
      .from('enrollments')
      .select('progress_percent, status')
      .eq('profile_id', profile.id)
      .eq('course_id', courseId)
      .single();

    if (enrollErr || !enrollment) return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });

    if (enrollment.progress_percent < 100 || enrollment.status !== 'completed') {
       return NextResponse.json({ error: 'Curso ainda não foi 100% concluído.' }, { status: 403 });
    }

    // Check if certificate exists
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('course_id', courseId)
      .single();

    if (existingCert) {
       return NextResponse.json({ certificate: existingCert, message: 'Certificado já emitido.' });
    }

    // Issue new certificate
    const { data: newCertificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        profile_id: profile.id,
        course_id: courseId,
        certificate_url: null // We generate visual on the fly, no hard PDF yet
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ certificate: newCertificate });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
