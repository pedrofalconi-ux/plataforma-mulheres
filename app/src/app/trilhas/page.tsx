'use client';

import { useAuth } from "@/hooks/useAuth";
import AuthWall from "@/components/auth/AuthWall";
import { CourseDashboard } from "@/components/courses/CourseComponents";

export default function TrilhasPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  return <CourseDashboard />;
}
