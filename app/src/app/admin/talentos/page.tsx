'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Loader2, Search, Users } from 'lucide-react';

type TalentRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papel: string;
  regiao: string;
  estado: string;
  habilidades: string;
  cadastro: string;
};

type SelectOption = {
  id: string;
  name: string;
  state?: string;
};

export default function AdminTalentosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TalentRow[]>([]);
  const [regions, setRegions] = useState<SelectOption[]>([]);
  const [skills, setSkills] = useState<SelectOption[]>([]);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [regionId, setRegionId] = useState('');
  const [skillId, setSkillId] = useState('');

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (regionId) params.set('regionId', regionId);
    if (skillId) params.set('skillId', skillId);
    return params.toString();
  }, [query, regionId, skillId]);

  async function fetchTalents() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/talents${filterQuery ? `?${filterQuery}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar talentos');

      setRows(data.rows || []);
      setRegions(data.options?.regions || []);
      setSkills(data.options?.skills || []);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar Banco de Talentos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await fetchTalents();
  }

  function exportFile(format: 'csv' | 'xlsx') {
    const params = new URLSearchParams();
    params.set('format', format);
    if (query.trim()) params.set('q', query.trim());
    if (regionId) params.set('regionId', regionId);
    if (skillId) params.set('skillId', skillId);
    window.open(`/api/admin/talents?${params.toString()}`, '_blank');
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Banco de Talentos</h1>
          <p className="text-stone-500">Busque voluntários por habilidade, região e dados de contato.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportFile('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => exportFile('xlsx')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
          >
            <Download size={16} />
            Exportar XLSX
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1.6fr_1fr_1fr_auto]"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, e-mail ou telefone"
            className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as regiões</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
              {region.state ? ` (${region.state})` : ''}
            </option>
          ))}
        </select>

        <select
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as habilidades</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800"
        >
          <Filter size={16} />
          Filtrar
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16 text-primary-700">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-center text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-stone-500">
            <Users size={36} className="mb-3 text-stone-300" />
            Nenhum talento encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Região</th>
                  <th className="px-5 py-3">Habilidades</th>
                  <th className="px-5 py-3">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-stone-900">{row.nome}</p>
                      <p className="text-xs text-stone-500">Perfil: {row.papel}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-stone-800">{row.email}</p>
                      <p className="text-xs text-stone-500">{row.telefone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-stone-800">{row.regiao}</p>
                      <p className="text-xs text-stone-500">{row.estado}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-700">{row.habilidades}</td>
                    <td className="px-5 py-4 text-stone-600">{row.cadastro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
