'use client';

import { useParams } from 'next/navigation';
import CourseOverview from "@/components/courses/CourseOverview";

export default function CourseOverviewPage() {
  const params = useParams();
  const courseId = params.id as string;

  return <CourseOverview courseId={courseId} />;
}
