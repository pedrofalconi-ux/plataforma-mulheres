'use client';

import { useAuth } from "@/hooks/useAuth";
import AuthWall from "@/components/auth/AuthWall";
import LiveView from "@/components/live/LiveView";

export default function AoVivoPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthWall />;
  }

  return <LiveView />;
}
