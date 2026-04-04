'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Download,
  Loader2,
  Search,
  Users,
  Filter,
  RefreshCw,
  Mail,
  MapPin,
  BadgeCheck,
  BookOpen,
} from 'lucide-react';
import { EnrollmentModal } from './EnrollmentModal';

type RegionJoin = {
  name?: string | null;
};

type SkillJoin = {
  name?: string | null;
};

type ProfileJoin = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  region_id: string | null;
  regions?: RegionJoin | RegionJoin[] | null;
};

type ProfileSkillJoin = {
  profile_id: string;
  skills?: SkillJoin | SkillJoin[] | null;
};

type TalentRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  region: string;
  skills: string[];
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  ADMIN: 'Administrador',
  student: 'Aluno',
  STUDENT: 'Aluno',
  partner: 'Parceiro',
  PARTNER: 'Parceiro',
  guest: 'Visitante',
  GUEST: 'Visitante',
  talent: 'Talento',
  TALENT: 'Talento',
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: TalentRow[]) {
  const headers = ['Nome', 'Email', 'Região', 'Habilidades', 'Papel'];
  const lines = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map((row) =>
      [
        row.fullName,
        row.email,
        row.region,
        row.skills.join(' | '),
        roleLabels[row.role] || row.role || 'Não informado',
      ]
        .map((cell) => escapeCsvCell(cell))
        .join(';')
    ),
  ];

  return `\uFEFF${lines.join('\n')}`;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
}

function mapNestedName(value?: RegionJoin | RegionJoin[] | SkillJoin | SkillJoin[] | null) {
  if (Array.isArray(value)) {
    return value[0]?.name?.trim() || '';
  }

  return value?.name?.trim() || '';
}

export default function AdminUsuariosPage() {
  const [talents, setTalents] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    let active = true;

    const loadTalents = async () => {
      setLoading(true);
      setError('');

      try {
        const supabase = createClient();

        const [{ data: profilesData, error: profilesError }, { data: skillsData, error: skillsError }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('id, full_name, email, phone, role, region_id, regions(name)')
              .order('full_name'),
            supabase
              .from('profile_skills')
              .select('profile_id, skills(name)')
              .order('profile_id'),
          ]);

        if (profilesError || skillsError) {
          const [{ data: fallbackProfiles, error: fallbackProfilesError }, { data: regionsData, error: regionsError }, { data: fallbackSkills, error: fallbackSkillsError }] =
            await Promise.all([
              supabase
                .from('profiles')
                .select('id, full_name, email, phone, role, region_id')
                .order('full_name'),
              supabase.from('regions').select('id, name').order('name'),
              supabase
                .from('profile_skills')
                .select('profile_id, skills(name)')
                .order('profile_id'),
            ]);

          if (fallbackProfilesError || regionsError || fallbackSkillsError) {
            throw new Error(
              profilesError?.message ||
                skillsError?.message ||
                fallbackProfilesError?.message ||
                regionsError?.message ||
                fallbackSkillsError?.message ||
                'Não foi possível carregar os perfis.'
            );
          }

          const regionMap = new Map(
            (regionsData || []).map((region) => [region.id, region.name?.trim() || ''])
          );
          const skillsMap = new Map<string, string[]>();

          (fallbackSkills || []).forEach((row: ProfileSkillJoin) => {
            const skillName = mapNestedName(row.skills);
            if (!skillName) return;
            const current = skillsMap.get(row.profile_id) || [];
            skillsMap.set(row.profile_id, [...current, skillName]);
          });

          const normalizedTalents = (fallbackProfiles || []).map((profile: ProfileJoin) => ({
            id: profile.id,
            fullName: profile.full_name?.trim() || 'Sem nome',
            email: profile.email?.trim() || 'Não informado',
            phone: profile.phone?.trim() || '',
            role: profile.role || 'student',
            region: regionMap.get(profile.region_id || '') || 'Sem região',
            skills: uniqueSorted(skillsMap.get(profile.id) || []),
          }));

          if (!active) return;
          setTalents(normalizedTalents);
          return;
        }

        const skillsMap = new Map<string, string[]>();

        (skillsData || []).forEach((row: ProfileSkillJoin) => {
          const skillName = mapNestedName(row.skills);
          if (!skillName) return;
          const current = skillsMap.get(row.profile_id) || [];
          skillsMap.set(row.profile_id, [...current, skillName]);
        });

        const normalizedTalents = (profilesData || []).map((profile: ProfileJoin) => ({
          id: profile.id,
          fullName: profile.full_name?.trim() || 'Sem nome',
          email: profile.email?.trim() || 'Não informado',
          phone: profile.phone?.trim() || '',
          role: profile.role || 'student',
          region: mapNestedName(profile.regions) || 'Sem região',
          skills: uniqueSorted(skillsMap.get(profile.id) || []),
        }));

        if (!active) return;
        setTalents(normalizedTalents);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || 'Falha ao carregar o banco de talentos.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTalents();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filteredTalents = talents.filter((talent) => {
    const normalizedSearch = normalizeText(searchTerm);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      normalizeText(talent.fullName).includes(normalizedSearch) ||
      normalizeText(talent.email).includes(normalizedSearch);
    const matchesRegion = selectedRegion === 'all' || talent.region === selectedRegion;
    const matchesSkill =
      selectedSkill === 'all' || talent.skills.some((skill) => skill === selectedSkill);

    return matchesSearch && matchesRegion && matchesSkill;
  });

  const regionOptions = uniqueSorted(talents.map((talent) => talent.region));
  const skillOptions = uniqueSorted(talents.flatMap((talent) => talent.skills));

  const handleExportCsv = () => {
    const csv = toCsv(filteredTalents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `banco-de-talentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleReload = () => {
    setSearchTerm('');
    setSelectedRegion('all');
    setSelectedSkill('all');
    setError('');
    setReloadKey((current) => current + 1);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary-900/10 bg-gradient-to-br from-primary-950 via-primary-900 to-stone-900 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(197,127,70,0.25),_transparent_38%)]" />
        <div className="relative grid gap-6 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <Users size={14} />
              Banco de Talentos
            </div>
            <div className="max-w-2xl space-y-3">
              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
                Gestão de perfis, regiões e habilidades da comunidade
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
                Consulte os membros cadastrados, filtre por região e competência, e exporte o recorte
                que você precisa em CSV.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportCsv}
                disabled={loading || filteredTalents.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                Exportar CSV
              </button>
              <button
                onClick={handleReload}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Perfis</div>
              <div className="mt-2 text-2xl font-bold">{talents.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Regiões</div>
              <div className="mt-2 text-2xl font-bold">{regionOptions.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Habilidades</div>
              <div className="mt-2 text-2xl font-bold">{skillOptions.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-stone-800">
          <Filter size={16} className="text-primary-700" />
          Filtros
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Busca</span>
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

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Região</span>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">Todas as regiões</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">Habilidade</span>
            <div className="relative">
              <BadgeCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">Todas as habilidades</option>
                {skillOptions.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Perfis encontrados</h2>
              <p className="text-sm text-stone-500">
                {loading
                  ? 'Carregando dados...'
                  : `${filteredTalents.length} resultado(s) no filtro atual`}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Users size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-stone-900">Não foi possível carregar os dados</h3>
            <p className="mt-2 text-sm text-stone-500">{error}</p>
            <button
              onClick={handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-stone-500">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="mt-4 text-sm">Carregando banco de talentos...</p>
          </div>
        ) : filteredTalents.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Users size={22} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-stone-900">Nenhum perfil encontrado</h3>
            <p className="mt-2 text-sm text-stone-500">
              Ajuste os filtros ou limpe a busca para ver outros resultados.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-stone-100 text-left">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4 font-bold">Nome</th>
                    <th className="px-5 py-4 font-bold">Email</th>
                    <th className="px-5 py-4 font-bold">Região</th>
                    <th className="px-5 py-4 font-bold">Habilidades</th>
                    <th className="px-5 py-4 font-bold">Papel</th>
                    <th className="px-5 py-4 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredTalents.map((talent) => (
                    <tr key={talent.id} className="transition hover:bg-stone-50/70">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-stone-900">{talent.fullName}</div>
                        {talent.phone ? (
                          <div className="mt-1 text-xs text-stone-500">{talent.phone}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">{talent.email}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{talent.region}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {talent.skills.length > 0 ? (
                            talent.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-stone-400">Sem habilidades cadastradas</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-stone-700">
                        {roleLabels[talent.role] || talent.role || 'Não informado'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedUser({ id: talent.id, name: talent.fullName })}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
                          title="Gerenciar Matrículas"
                        >
                          <BookOpen size={14} />
                          Matrículas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {filteredTalents.map((talent) => (
                <article key={talent.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-stone-900">{talent.fullName}</h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-stone-600">
                        <Mail size={14} className="shrink-0 text-stone-400" />
                        <span className="break-all">{talent.email}</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600">
                      {roleLabels[talent.role] || talent.role || 'Não informado'}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedUser({ id: talent.id, name: talent.fullName })}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-50 py-2.5 text-xs font-bold text-primary-700"
                    >
                      <BookOpen size={14} />
                      Gerenciar Matrículas
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-stone-400" />
                      <span>{talent.region}</span>
                    </div>
                    {talent.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-stone-400" />
                        <span>{talent.phone}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {talent.skills.length > 0 ? (
                      talent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-semibold text-primary-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-stone-400">Sem habilidades cadastradas</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedUser && (
        <EnrollmentModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
