import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ensureProfileEnrollmentForCourse } from '@/lib/universal-enrollment';

const ActivitySubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      answer: z.string().trim().max(5000),
    }),
  ),
});

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

function normalizeAnswers(rawAnswers: unknown, questionsCount: number) {
  if (!Array.isArray(rawAnswers)) return [];

  return rawAnswers
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const questionIndex = Number((item as Record<string, unknown>).questionIndex);
      const answer = String((item as Record<string, unknown>).answer || '').trim();
      if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= questionsCount) return null;
      return { questionIndex, answer };
    })
    .filter((item): item is { questionIndex: number; answer: string } => Boolean(item));
}

function resolveCourseId(modules: unknown) {
  if (Array.isArray(modules)) {
    return modules[0]?.course_id || null;
  }

  if (modules && typeof modules === 'object') {
    return (modules as { course_id?: string | null }).course_id || null;
  }

  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: lessonId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title, activity_questions, modules!inner(course_id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    const courseId = resolveCourseId(lesson.modules);
    if (courseId) {
      const adminClient = await createAdminClient();
      await ensureProfileEnrollmentForCourse(adminClient, user.id, courseId);
    }

    const questions = normalizeQuestions(lesson.activity_questions);

    const { data: submission } = await supabase
      .from('lesson_activity_submissions')
      .select('id, answers, submitted_at, updated_at, admin_reply, admin_replied_at')
      .eq('lesson_id', lessonId)
      .eq('profile_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      lessonId,
      lessonTitle: lesson.title,
      questions,
      submission: submission
        ? {
            id: submission.id,
            answers: normalizeAnswers(submission.answers, questions.length),
            submittedAt: submission.submitted_at,
            updatedAt: submission.updated_at,
            adminReply: typeof submission.admin_reply === 'string' ? submission.admin_reply : '',
            adminRepliedAt: submission.admin_replied_at,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar atividade.' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: lessonId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, activity_questions, modules!inner(course_id)')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    const courseId = resolveCourseId(lesson.modules);
    if (courseId) {
      const adminClient = await createAdminClient();
      await ensureProfileEnrollmentForCourse(adminClient, user.id, courseId);
    }

    const questions = normalizeQuestions(lesson.activity_questions);
    if (questions.length === 0) {
      return NextResponse.json({ error: 'Esta aula ainda não possui atividade cadastrada.' }, { status: 400 });
    }

    const payload = ActivitySubmissionSchema.parse(await request.json());
    const answers = normalizeAnswers(payload.answers, questions.length);

    const { data, error } = await supabase
      .from('lesson_activity_submissions')
      .upsert(
        {
          lesson_id: lessonId,
          profile_id: user.id,
          answers,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'lesson_id,profile_id' },
      )
      .select('id, answers, submitted_at, updated_at, admin_reply, admin_replied_at')
      .single();

    if (error || !data) {
      throw error || new Error('Não foi possível salvar a atividade.');
    }

    return NextResponse.json({
      submission: {
        id: data.id,
        answers: normalizeAnswers(data.answers, questions.length),
        submittedAt: data.submitted_at,
        updatedAt: data.updated_at,
        adminReply: typeof data.admin_reply === 'string' ? data.admin_reply : '',
        adminRepliedAt: data.admin_replied_at,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dados invalidos.' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Erro ao salvar atividade.' }, { status: 500 });
  }
}
