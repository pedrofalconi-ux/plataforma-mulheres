'use client';

import { useParams } from 'next/navigation';
import CoursePlayer from "@/components/courses/CoursePlayer";

export default function CoursePlayerPage() {
  const params = useParams();
  const courseId = params.id as string;

  return <CoursePlayer courseId={courseId} />;
}
