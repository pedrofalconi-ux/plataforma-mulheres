'use client';

import { useParams } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import AuthWall from "@/components/auth/AuthWall";
import CourseOverview from "@/components/courses/CourseOverview";

export default function CourseOverviewPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const courseId = params.id as string;

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  return <CourseOverview courseId={courseId} />;
}
