'use client';

import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-600 min-h-[50vh] flex items-center justify-center">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2">Acesso Negado</h2>
          <p className="text-stone-500">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
