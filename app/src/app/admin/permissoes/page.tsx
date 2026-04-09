'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Shield, ShieldOff, Users } from 'lucide-react';

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function AdminPermissoesPage() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      setLoading(true);
      setError('');

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('role', ['student', 'admin'])
          .order('full_name');

        if (error) {
          throw error;
        }

        if (!active) return;
        setProfiles(data || []);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Nao foi possivel carregar as permissoes.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfiles();

    return () => {
      active = false;
    };
  }, [supabase]);

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    if (!normalizedSearch) return profiles;

    return profiles.filter((profile) => {
      const name = normalizeText(profile.full_name || '');
      const email = normalizeText(profile.email || '');
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [profiles, searchTerm]);

  const adminCount = profiles.filter((profile) => profile.role?.toLowerCase() === 'admin').length;

  const handleRoleToggle = async (profile: AdminProfile) => {
    const nextRole = profile.role?.toLowerCase() === 'admin' ? 'student' : 'admin';
    const confirmationText =
      nextRole === 'admin'
        ? `Deseja conceder acesso de administradora para ${profile.full_name || profile.email || 'esta usuaria'}?`
        : `Deseja remover o acesso de administradora de ${profile.full_name || profile.email || 'esta usuaria'}?`;

    if (!confirm(confirmationText)) return;

    setUpdatingId(profile.id);

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          role: nextRole,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel atualizar a permissao.');
      }

      setProfiles((current) =>
        current.map((item) => (item.id === profile.id ? { ...item, role: nextRole } : item))
      );
    } catch (err: any) {
      alert(err?.message || 'Nao foi possivel atualizar a permissao.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-primary-900/10 bg-gradient-to-br from-primary-950 via-primary-900 to-stone-900 px-6 py-8 text-white shadow-xl lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <Shield size={14} />
              Permissoes administrativas
            </div>
            <div className="max-w-2xl space-y-3">
              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
                Promova ou remova administradoras com rapidez
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
                Esta area permite controlar quem pode acessar o painel administrativo da plataforma.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Administradoras</div>
              <div className="mt-2 text-2xl font-bold">{adminCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Perfis elegiveis</div>
              <div className="mt-2 text-2xl font-bold">{profiles.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Buscar usuaria</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text"
              placeholder="Pesquisar por nome ou e-mail"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-900">Controle de administradoras</h2>
          <p className="text-sm text-stone-500">
            {loading ? 'Carregando perfis...' : `${filteredProfiles.length} perfil(is) encontrados`}
          </p>
        </div>

        {error ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Users size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-stone-900">Nao foi possivel carregar as permissoes</h3>
            <p className="mt-2 text-sm text-stone-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-stone-500">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="mt-4 text-sm">Carregando permissoes...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Users size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-stone-900">Nenhum perfil encontrado</h3>
            <p className="mt-2 text-sm text-stone-500">Ajuste a busca para localizar outra usuaria.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4">
            {filteredProfiles.map((profile) => {
              const isAdmin = profile.role?.toLowerCase() === 'admin';

              return (
                <article
                  key={profile.id}
                  className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-stone-900">{profile.full_name || 'Sem nome'}</h3>
                    <p className="mt-1 break-all text-sm text-stone-600">{profile.email || 'Sem e-mail'}</p>
                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        isAdmin ? 'bg-primary-100 text-primary-800' : 'bg-white text-stone-600'
                      }`}
                    >
                      {isAdmin ? 'Administradora' : 'Aluna'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRoleToggle(profile)}
                    disabled={updatingId === profile.id}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isAdmin
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {updatingId === profile.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isAdmin ? (
                      <ShieldOff size={16} />
                    ) : (
                      <Shield size={16} />
                    )}
                    {isAdmin ? 'Remover acesso admin' : 'Conceder acesso admin'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
