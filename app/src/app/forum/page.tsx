'use client';

import { useAuth } from "@/hooks/useAuth";
import AuthWall from "@/components/auth/AuthWall";
import ForumView from "@/components/forum/ForumView";

export default function ForumPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  return <ForumView />;
}
