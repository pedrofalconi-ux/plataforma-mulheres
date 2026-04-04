'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Shield,
  ChevronLeft,
  Users,
  FileText,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type AdminLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navLinks: AdminLink[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/cursos', label: 'Gestao de Trilhas', icon: BookOpen },
    { href: '/admin/blog', label: 'Blog Engine', icon: Newspaper },
    { href: '/admin/talentos', label: 'Banco de Talentos', icon: Users },
    { href: '/admin/institucional', label: 'Painel Institucional', icon: FileText },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-stone-50">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 bg-stone-50 p-6">
          <div className="flex items-center gap-3 font-serif font-bold text-primary-900">
            <Shield className="text-primary-600" />
            Admin Studio
          </div>
          <p className="mt-1 text-xs text-stone-500">Bem-vindo, {user?.name?.split(' ')[0] || 'Administrador'}</p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-200 p-4">
          <Link
            href="/trilhas"
            className="flex items-center gap-2 text-sm font-bold text-stone-500 transition-colors hover:text-stone-800"
          >
            <ChevronLeft size={16} /> Voltar para o aplicativo
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-stone-50/50 p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
