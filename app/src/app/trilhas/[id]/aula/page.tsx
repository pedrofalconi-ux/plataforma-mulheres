'use client';

import { useParams } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import AuthWall from "@/components/auth/AuthWall";
import CoursePlayer from "@/components/courses/CoursePlayer";

export default function CoursePlayerPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const courseId = params.id as string;

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  return <CoursePlayer courseId={courseId} />;
}
