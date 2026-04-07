import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

function normalizeAnswers(rawAnswers: unknown) {
  if (!Array.isArray(rawAnswers)) return [];

  return rawAnswers
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const questionIndex = Number((item as Record<string, unknown>).questionIndex);
      const answer = String((item as Record<string, unknown>).answer || '').trim();
      if (!Number.isInteger(questionIndex) || questionIndex < 0) return null;
      return { questionIndex, answer };
    })
    .filter((item): item is { questionIndex: number; answer: string } => Boolean(item));
}

function normalizeQuestions(rawQuestions: unknown) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const prompt = String((item as Record<string, unknown>).prompt || '').trim();
      if (!prompt) return null;
      return { prompt };
    })
    .filter((item): item is { prompt: string } => Boolean(item));
}

export async function GET(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    let query = adminContext.adminClient
      .from('lesson_activity_submissions')
      .select(`
        id,
        answers,
        admin_reply,
        admin_replied_at,
        submitted_at,
        updated_at,
        profiles!lesson_activity_submissions_profile_id_fkey (
          id,
          full_name,
          email
        ),
        lessons!lesson_activity_submissions_lesson_id_fkey (
          id,
          title,
          activity_questions,
          modules!inner (
            id,
            title,
            courses!inner (
              id,
              title
            )
          )
        )
      `)
      .order('updated_at', { ascending: false });

    if (courseId) {
      query = query.eq('lessons.modules.courses.id', courseId);
    }

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = (data || []).map((item: any) => ({
      id: item.id,
      submittedAt: item.submitted_at,
      updatedAt: item.updated_at,
      student: {
        id: item.profiles?.id,
        name: item.profiles?.full_name || 'Aluna',
        email: item.profiles?.email || '',
      },
      course: {
        id: item.lessons?.modules?.courses?.id,
        title: item.lessons?.modules?.courses?.title || 'Trilha',
      },
      module: {
        id: item.lessons?.modules?.id,
        title: item.lessons?.modules?.title || 'Modulo',
      },
      lesson: {
        id: item.lessons?.id,
        title: item.lessons?.title || 'Aula',
      },
      questions: normalizeQuestions(item.lessons?.activity_questions),
      answers: normalizeAnswers(item.answers),
      adminReply: typeof item.admin_reply === 'string' ? item.admin_reply : '',
      adminRepliedAt: item.admin_replied_at,
    }));

    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar respostas.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const payload = await request.json();
    const submissionId = String(payload.id || '').trim();
    const adminReply = String(payload.adminReply || '').trim();

    if (!submissionId) {
      return NextResponse.json({ error: 'Resposta da atividade nao informada.' }, { status: 400 });
    }

    const { data, error } = await adminContext.adminClient
      .from('lesson_activity_submissions')
      .update({
        admin_reply: adminReply || null,
        admin_replied_at: adminReply ? new Date().toISOString() : null,
        admin_replied_by: adminReply ? adminContext.user.id : null,
      })
      .eq('id', submissionId)
      .select('id, admin_reply, admin_replied_at')
      .single();

    if (error || !data) {
      throw error || new Error('Nao foi possivel salvar a devolutiva.');
    }

    return NextResponse.json({
      id: data.id,
      adminReply: data.admin_reply || '',
      adminRepliedAt: data.admin_replied_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar devolutiva.' }, { status: 500 });
  }
}
