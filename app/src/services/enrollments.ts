import { createClient } from '@/lib/supabase/server';

export async function getEnrollments(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, courses(*, categories(name))')
    .eq('profile_id', profileId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function enroll(profileId: string, courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ profile_id: profileId, course_id: courseId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLessonProgress(
  enrollmentId: string,
  lessonId: string,
  completed: boolean,
  watchTimeSeconds: number = 0
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      completed,
      watch_time_seconds: watchTimeSeconds,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;

  // Recalcular progresso do enrollment
  if (completed) {
    await recalculateProgress(enrollmentId);
  }

  return data;
}

async function recalculateProgress(enrollmentId: string) {
  const supabase = await createClient();

  // Buscar enrollment com curso
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return;

  // Contar total de aulas do curso
  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .in('module_id',
      (await supabase.from('modules').select('id').eq('course_id', enrollment.course_id)).data?.map(m => m.id) || []
    );

  // Contar aulas completadas
  const { count: completedLessons } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .eq('completed', true);

  const progress = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;

  await supabase
    .from('enrollments')
    .update({
      progress_percent: progress,
      status: progress >= 100 ? 'completed' : 'active',
      completed_at: progress >= 100 ? new Date().toISOString() : null,
    })
    .eq('id', enrollmentId);
}

export async function getProgress(enrollmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) throw error;
  return data;
}

export async function issueCertificate(profileId: string, courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('certificates')
    .insert({ profile_id: profileId, course_id: courseId })
    .select()
    .single();

  if (error) throw error;
  return data;
}
