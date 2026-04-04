import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ProgressSchema = z.object({
  lessonId: z.string().regex(uuidRegex, 'ID de aula inválido'),
  courseId: z.string().regex(uuidRegex, 'ID de curso inválido'),
  watchTime: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
 
    if (!user) {
      console.error('[PROGRESS API] No user found in session');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[PROGRESS API] User authenticated:', user.id);

    // Use Admin Client for database operations to bypass RLS issues
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = await createAdminClient();
 
    const body = await req.json();
    console.log('[PROGRESS API] Request body:', body);
    
    const { lessonId, courseId, watchTime = 0, completed = false } = ProgressSchema.parse(body);
    console.log('[PROGRESS API] Parsed data:', { lessonId, courseId, completed });
 
    // 1. Get/Create Enrollment (using admin client)
    const { data: existingEnrollment, error: fetchErr } = await adminSupabase
      .from('enrollments')
      .select('id')
      .eq('profile_id', user.id)
      .eq('course_id', courseId)
      .single();

    let enrollment = existingEnrollment;
 
    if (fetchErr && fetchErr.code !== 'PGRST116') {
        console.error('[PROGRESS API] Enrollment fetch error:', fetchErr);
    }

    if (!enrollment) {
      console.log('[PROGRESS API] Creating auto-enrollment for:', { userId: user.id, courseId });
      const { data: newEnrollment, error: createError } = await adminSupabase
        .from('enrollments')
        .insert({
          profile_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percent: 0
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('[PROGRESS API] Error creating auto-enrollment:', createError);
        return NextResponse.json({ error: 'Falha ao criar matrícula automática', details: createError.message }, { status: 500 });
      }
      enrollment = newEnrollment;
      console.log('[PROGRESS API] Auto-enrollment created:', enrollment?.id);
    } else {
      console.log('[PROGRESS API] Found existing enrollment:', enrollment.id);
    }
 
    // 2. Upsert lesson progress
    console.log('[PROGRESS API] Upserting lesson progress:', { enrollmentId: enrollment!.id, lessonId });
    const { error: progressError } = await adminSupabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollment!.id,
        lesson_id: lessonId,
        watch_time_seconds: watchTime,
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      }, { onConflict: 'enrollment_id, lesson_id' });
 
    if (progressError) {
        console.error('[PROGRESS API] Progress upsert error:', progressError);
        throw progressError;
    }
 
    // 3. Recalculate global progress always
    {
      const { data: totalLessonsData } = await adminSupabase
        .from('lessons')
        .select('id, modules!inner(course_id)')
        .eq('modules.course_id', courseId);
      
      const totalLessons = totalLessonsData?.length || 0;
 
      const { count: completedLessons } = await adminSupabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('enrollment_id', enrollment.id)
        .eq('completed', true);
      
      const progressPercent = totalLessons > 0 
        ? Math.round(((completedLessons || 0) / totalLessons) * 100) 
        : 0;
 
      const { error: updateError } = await adminSupabase
        .from('enrollments')
        .update({ 
          progress_percent: Math.min(progressPercent, 100),
          ...(progressPercent >= 100 ? { 
            completed_at: new Date().toISOString(), 
            status: 'completed' 
          } : {
            completed_at: null,
            status: 'active'
          }) 
        })
        .eq('id', enrollment.id);
        
      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        progressPercent: Math.min(progressPercent, 100),
        completedLessons: completedLessons || 0,
        totalLessons,
        status: progressPercent >= 100 ? 'completed' : 'active',
      });
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
