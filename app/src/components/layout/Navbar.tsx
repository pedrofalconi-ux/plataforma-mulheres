'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_NAME } from '@/lib/constants';

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-serif text-[2.2rem] font-semibold leading-none tracking-tight text-primary-900">{BRAND_NAME}</span>
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const firstName = user?.name?.split(' ')[0] || 'Conta';

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/sobre', label: 'Sobre' },
    { href: '/trilhas', label: 'Aprendizado' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav className="site-header sticky top-0 z-50">
      <div className="site-header-inner">
        <Link href="/" className="flex min-w-0 items-center">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="header-link"
              data-active={isActive(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/perfil" className="header-link" data-active={isActive('/perfil')}>
                {firstName}
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="button-secondary border border-primary-900/20 !px-4 !py-3 !text-primary-900">
                  Admin
                </Link>
              ) : null}
              <button type="button" onClick={logout} className="button-secondary border border-primary-900/20 !px-4 !py-3 !text-primary-900">
                <LogOut size={16} />
                Sair
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="header-link" data-active={isActive('/login')}>
                Entrar
              </Link>
              <Link href="/login" className="button-primary">
                Acessar plataforma
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="border border-primary-900/15 bg-white p-3 text-primary-900 lg:hidden"
            aria-label="Abrir menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-primary-900/10 bg-[#f7f1ec] px-4 py-5 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-4">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-primary-900/8 pb-3 text-sm font-extrabold uppercase tracking-[0.22em] text-primary-900"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <div className="grid gap-3 pt-3">
                <Link href="/perfil" onClick={() => setIsOpen(false)} className="flex items-center gap-3 border border-primary-900/10 px-4 py-4 text-sm font-semibold text-primary-900">
                  <UserIcon size={18} />
                  Meu perfil
                </Link>
                <Link href="/trilhas" onClick={() => setIsOpen(false)} className="flex items-center gap-3 border border-primary-900/10 px-4 py-4 text-sm font-semibold text-primary-900">
                  <BookOpen size={18} />
                  Meu aprendizado
                </Link>
                {isAdmin ? (
                  <Link href="/admin" onClick={() => setIsOpen(false)} className="button-secondary border border-primary-900/20 !justify-center !text-primary-900">
                    Admin
                  </Link>
                ) : null}
                <button type="button" onClick={() => { logout(); setIsOpen(false); }} className="button-primary !justify-center">
                  Sair
                </button>
              </div>
            ) : (
              <div className="grid gap-3 pt-3">
                <Link href="/login" onClick={() => setIsOpen(false)} className="button-secondary border border-primary-900/20 !justify-center !text-primary-900">
                  Entrar
                </Link>
                <Link href="/login" onClick={() => setIsOpen(false)} className="button-primary !justify-center">
                  Acessar plataforma
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
