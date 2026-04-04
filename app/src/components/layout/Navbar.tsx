'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Newspaper,
  ShoppingCart,
  Stethoscope,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_NAME } from '@/lib/constants';

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const communityItems: Item[] = [
  { href: '/forum', label: 'Comunidade', icon: Users },
  { href: '/trilhas', label: 'Minhas Trilhas', icon: BookOpen },
];

const platformItems: Item[] = [
  { href: '/trilhas', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: Calendar },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-serif text-2xl font-bold tracking-tight text-primary-900">{BRAND_NAME}</span>
    </div>
  );
}

function DesktopDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: Item[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const active = items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`motion-tab flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
          active || open ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
        }`}
        data-active={active || open}
      >
        <span>{label}</span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.7rem)] w-64 rounded-3xl border border-primary-900/10 bg-white/95 p-2 shadow-[0_20px_60px_rgba(22,63,46,0.16)] backdrop-blur">
          {items.map((item) => {
            const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  itemActive ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
                }`}
              >
                <Icon size={17} className={itemActive ? 'text-primary-700' : 'text-stone-500'} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AccountMenu({
  firstName,
  cartCount,
  showAdmin,
  onLogout,
  pathname,
}: {
  firstName?: string;
  cartCount: number;
  showAdmin: boolean;
  onLogout: () => void;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const profileActive = pathname === '/perfil' || pathname.startsWith('/perfil/');
  const adminActive = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <div ref={rootRef} className="relative hidden items-center gap-2 lg:flex">
      <Link
        href="/carrinho"
        className={`motion-button relative flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          pathname === '/carrinho'
            ? 'border-primary-200 bg-primary-100 text-primary-800'
            : 'border-primary-900/8 bg-white/80 text-stone-700 hover:bg-primary-50'
        }`}
      >
        <ShoppingCart size={17} />
        <span>Carrinho</span>
        {cartCount > 0 ? (
          <span className="rounded-full bg-primary-700 px-2 py-0.5 text-xs font-bold text-white">{cartCount}</span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`motion-button flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          open ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-primary-900/8 bg-white/80 text-stone-700 hover:bg-primary-50'
        }`}
      >
        <UserIcon size={16} />
        <span>{firstName ? firstName : 'Conta'}</span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.7rem)] w-60 rounded-3xl border border-primary-900/10 bg-white/95 p-2 shadow-[0_20px_60px_rgba(22,63,46,0.16)] backdrop-blur">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
              profileActive ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
            }`}
          >
            <UserIcon size={17} className={profileActive ? 'text-primary-700' : 'text-stone-500'} />
            <span className="font-semibold">Meu perfil</span>
          </Link>

          {showAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                adminActive ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
              }`}
            >
              <LayoutDashboard size={17} className={adminActive ? 'text-primary-700' : 'text-stone-500'} />
              <span className="font-semibold">Painel admin</span>
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
          >
            <LogOut size={17} />
            <span>Sair</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MobileLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  badge,
}: Item & { active: boolean; onNavigate: () => void; badge?: number }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
      }`}
    >
      <Icon size={17} className={active ? 'text-primary-700' : 'text-stone-500'} />
      <span>{label}</span>
      {typeof badge === 'number' && badge > 0 ? (
        <span className="ml-auto rounded-full bg-primary-700 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>
      ) : null}
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const firstName = user?.name?.split(' ')[0];
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        setCartCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setCartCount(0);
      }
    };

    fetchCart();
    window.addEventListener('cart-updated', fetchCart);
    return () => window.removeEventListener('cart-updated', fetchCart);
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 px-3 py-3 sm:px-5">
      <div className="glass-panel motion-float motion-glow mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-primary-900/8 bg-white/65 p-1 lg:flex">
          <Link
            href="/"
            className={`motion-tab rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive('/') ? 'bg-primary-100 text-primary-800' : 'text-stone-700 hover:bg-primary-50'
            }`}
            data-active={isActive('/')}
          >
            Inicio
          </Link>
          <DesktopDropdown label="Comunidade" items={communityItems} pathname={pathname} />
          {user ? <DesktopDropdown label="Plataforma" items={platformItems} pathname={pathname} /> : null}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <AccountMenu
              firstName={firstName}
              cartCount={user ? cartCount : 0}
              showAdmin={isAdmin}
              onLogout={logout}
              pathname={pathname}
            />
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-primary-50">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="motion-button rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800"
              >
                Comecar
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-2xl bg-primary-50 p-3 text-primary-800 lg:hidden"
            aria-label="Abrir menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="glass-panel motion-modal mx-auto mt-3 max-w-7xl rounded-[28px] p-4 lg:hidden">
          <div className="grid gap-2">
            <MobileLink href="/" label="Inicio" icon={Home} active={isActive('/')} onNavigate={() => setIsOpen(false)} />

            <div className="px-3 pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">Comunidade</div>
            {communityItems.map((item) => (
              <MobileLink key={item.href} {...item} active={isActive(item.href)} onNavigate={() => setIsOpen(false)} />
            ))}

            {user ? (
              <>
                <div className="px-3 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">Plataforma</div>
                {platformItems.map((item) => (
                  <MobileLink key={item.href} {...item} active={isActive(item.href)} onNavigate={() => setIsOpen(false)} />
                ))}
                <div className="px-3 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600">Conta</div>
                <MobileLink
                  href="/carrinho"
                  label="Carrinho"
                  icon={ShoppingCart}
                  active={isActive('/carrinho')}
                  onNavigate={() => setIsOpen(false)}
                  badge={user ? cartCount : 0}
                />
                <MobileLink href="/perfil" label="Meu perfil" icon={UserIcon} active={isActive('/perfil')} onNavigate={() => setIsOpen(false)} />
                {isAdmin ? (
                  <MobileLink href="/admin" label="Painel admin" icon={LayoutDashboard} active={isActive('/admin')} onNavigate={() => setIsOpen(false)} />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setIsOpen(false)} className="rounded-2xl border border-primary-900/10 px-4 py-3 text-center text-sm font-semibold text-stone-700">
                  Entrar
                </Link>
                <Link href="/cadastro" onClick={() => setIsOpen(false)} className="rounded-2xl bg-primary-700 px-4 py-3 text-center text-sm font-bold text-white">
                  Comecar
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
