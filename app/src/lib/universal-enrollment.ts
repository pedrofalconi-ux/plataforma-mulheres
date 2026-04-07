export async function ensureProfileEnrolledInAllCourses(adminClient: any, profileId: string) {
  const { data: courses, error: coursesError } = await adminClient
    .from('courses')
    .select('id');

  if (coursesError) throw coursesError;
  if (!courses || courses.length === 0) return;

  const enrollments = courses.map((course: { id: string }) => ({
    profile_id: profileId,
    course_id: course.id,
    status: 'active',
  }));

  const { error } = await adminClient
    .from('enrollments')
    .upsert(enrollments, { onConflict: 'profile_id,course_id', ignoreDuplicates: true });

  if (error) throw error;
}

export async function ensureAllStudentsEnrolledInCourse(adminClient: any, courseId: string) {
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id')
    .in('role', ['student', 'admin']);

  if (profilesError) throw profilesError;
  if (!profiles || profiles.length === 0) return;

  const enrollments = profiles.map((profile: { id: string }) => ({
    profile_id: profile.id,
    course_id: courseId,
    status: 'active',
  }));

  const { error } = await adminClient
    .from('enrollments')
    .upsert(enrollments, { onConflict: 'profile_id,course_id', ignoreDuplicates: true });

  if (error) throw error;
}

export async function ensureProfileEnrollmentForCourse(adminClient: any, profileId: string, courseId: string) {
  const { error } = await adminClient
    .from('enrollments')
    .upsert(
      {
        profile_id: profileId,
        course_id: courseId,
        status: 'active',
      },
      { onConflict: 'profile_id,course_id' },
    );

  if (error) throw error;
}
