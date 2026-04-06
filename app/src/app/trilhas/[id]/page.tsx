'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  useEffect(() => {
    router.replace(`/trilhas/${courseId}/aula`);
  }, [courseId, router]);

  return null;
}
