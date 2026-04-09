'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Loader2,
  MapPin,
  PlusCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type Project = {
  id: string;
  name: string;
  category: 'alimentacao' | 'saude' | 'educacao' | 'espiritualidade' | 'moradia';
  description: string | null;
  address: string | null;
  contact: string | null;
  lat: number | null;
  lng: number | null;
  status: 'pending' | 'approved' | 'rejected';
};

const ObservatoryMap = dynamic(() => import('./ObservatoryMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-stone-100 text-stone-500">
      <Loader2 className="animate-spin" size={24} />
    </div>
  ),
});

const CATEGORY_LABELS: Record<Project['category'], string> = {
  alimentacao: 'Alimentação',
  saude: 'Saude',
  educacao: 'Educação',
  espiritualidade: 'Espiritualidade',
  moradia: 'Moradia',
};

type SubmitForm = {
  name: string;
  category: Project['category'];
  address: string;
  description: string;
  contact: string;
};

const INITIAL_FORM: SubmitForm = {
  name: '',
  category: 'alimentacao',
  address: '',
  description: '',
  contact: '',
};

export default function ObservatoryView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'todos' | Project['category']>('todos');
  const [query, setQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState<SubmitForm>(INITIAL_FORM);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao carregar projetos.');
      }

      const nextProjects = Array.isArray(data) ? data : [];
      setProjects(nextProjects);
      setSelectedProjectId((current) => current || nextProjects[0]?.id || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Não foi possível carregar os projetos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const byCategory = filter === 'todos' || project.category === filter;
      if (!byCategory) return false;

      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) return true;

      const content = [project.name, project.description || '', project.address || '', project.contact || '']
        .join(' ')
        .toLowerCase();

      return content.includes(normalizedQuery);
    });
  }, [filter, projects, query]);

  useEffect(() => {
    if (!filteredProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(filteredProjects[0]?.id || null);
    }
  }, [filteredProjects, selectedProjectId]);

  const selectedProject = filteredProjects.find((project) => project.id === selectedProjectId) || null;
  const projectsWithCoordinates = filteredProjects.filter(
    (project) => typeof project.lat === 'number' && typeof project.lng === 'number'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data?.error)) {
          throw new Error(data.error.map((item: { message?: string }) => item.message).join(' | '));
        }
        throw new Error(data?.error || 'Erro ao submeter projeto.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowSubmitModal(false);
        setFormData(INITIAL_FORM);
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Falha ao enviar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="motion-shell px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <section className="hero-sheen motion-float mx-auto max-w-7xl overflow-hidden rounded-[34px] px-6 py-10 text-white shadow-[0_25px_80px_rgba(22,63,46,0.16)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin size={16} />
              observatorio social
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Projetos sociais com contexto, localização e visibilidade pública.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-primary-100 md:text-lg">
              Mapeie iniciativas, visualize a distribuição territorial das ações e abra cada projeto para conhecer contatos,
              descrição e endereço com mais clareza.
            </p>
          </div>

          <div className="motion-list grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-200">Projetos</p>
              <p className="mt-2 text-3xl font-serif font-bold">{filteredProjects.length}</p>
            </div>
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-200">No mapa</p>
              <p className="mt-2 text-3xl font-serif font-bold">{projectsWithCoordinates.length}</p>
            </div>
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-200">Abertura</p>
              <p className="mt-2 text-lg font-semibold">Cada iniciativa pode ser acessada em página própria.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="glass-panel motion-card overflow-hidden rounded-[30px]">
          <div className="border-b border-primary-900/8 p-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Iniciativas</h2>
            <p className="mt-2 text-sm text-stone-500">Filtre, navegue e abra os projetos cadastrados no observatório.</p>

            <div className="relative mt-5">
              <input
                type="text"
                placeholder="Buscar por nome, endereço ou contato..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-stone-300 bg-white py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-4 top-3.5 text-stone-400" size={18} />
            </div>

            <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilter('todos')}
                className={`motion-tab whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                  filter === 'todos' ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                data-active={filter === 'todos'}
              >
                Todos
              </button>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value as Project['category'])}
                  className={`motion-tab whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                    filter === value ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  data-active={filter === value}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (!user) {
                  alert('Você precisa fazer login para cadastrar uma iniciativa.');
                  return;
                }
                setShowSubmitModal(true);
              }}
              className="motion-button mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              <PlusCircle size={16} /> Submeter iniciativa
            </button>
          </div>

          <div className="motion-list max-h-[780px] space-y-3 overflow-y-auto p-4">
            {loading ? (
              <div className="flex justify-center py-10 text-stone-400">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-stone-400">
                Nenhuma iniciativa encontrada para os filtros atuais.
              </div>
            ) : (
              filteredProjects.map((project) => {
                const selected = project.id === selectedProjectId;
                return (
                  <article
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`motion-card cursor-pointer rounded-[24px] border p-4 transition ${
                      selected
                        ? 'border-primary-200 bg-primary-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-primary-100 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-stone-900">{project.name}</h3>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500">
                        {CATEGORY_LABELS[project.category]}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                      {project.description || 'Sem descrição informada.'}
                    </p>
                    <p className="mt-3 flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={12} /> {project.address || 'Endereço não informado'}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-stone-400">
                        {typeof project.lat === 'number' && typeof project.lng === 'number'
                          ? 'Georreferenciado'
                          : 'Sem coordenadas'}
                      </span>
                      <Link
                        href={`/observatorio/${project.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 text-sm font-bold text-primary-700"
                      >
                        Abrir <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="glass-panel motion-card overflow-hidden rounded-[30px]">
            <div className="flex items-center justify-between border-b border-primary-900/8 px-6 py-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">Mapa das ações</h2>
                <p className="text-sm text-stone-500">OpenStreetMap com marcação dos locais aprovados.</p>
              </div>
              <div className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                {projectsWithCoordinates.length} ponto(s)
              </div>
            </div>
            <div className="h-[520px]">
              <ObservatoryMap
                projects={filteredProjects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="soft-card motion-card rounded-[30px] p-6">
            {selectedProject ? (
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
                    {CATEGORY_LABELS[selectedProject.category]}
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-stone-900">{selectedProject.name}</h3>
                  <p className="mt-4 text-base leading-8 text-stone-600">
                    {selectedProject.description || 'Esta iniciativa ainda não possui descrição detalhada.'}
                  </p>
                </div>

                <div className="motion-card rounded-[26px] border border-primary-900/8 bg-white p-5">
                  <div className="space-y-4 text-sm text-stone-600">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Endereço</p>
                      <p className="mt-1">{selectedProject.address || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Contato</p>
                      <p className="mt-1">{selectedProject.contact || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Mapa</p>
                      <p className="mt-1">
                        {typeof selectedProject.lat === 'number' && typeof selectedProject.lng === 'number'
                          ? `${selectedProject.lat.toFixed(5)}, ${selectedProject.lng.toFixed(5)}`
                          : 'Coordenadas indisponíveis'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/observatorio/${selectedProject.id}`}
                      className="motion-button inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
                    >
                      Abrir projeto <ArrowRight size={16} />
                    </Link>
                    {typeof selectedProject.lat === 'number' && typeof selectedProject.lng === 'number' ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedProject.lat}&mlon=${selectedProject.lng}#map=15/${selectedProject.lat}/${selectedProject.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="motion-button inline-flex items-center gap-2 rounded-full border border-primary-900/10 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-primary-50"
                      >
                        Abrir no OSM <ExternalLink size={16} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-stone-500">Selecione uma iniciativa para ver os encaminhamentos e detalhes.</div>
            )}
          </div>
        </div>
      </section>

      {showSubmitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="motion-modal relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <button onClick={() => setShowSubmitModal(false)} className="absolute right-4 top-4 text-stone-400 hover:text-stone-600">
              X
            </button>

            {!submitted ? (
              <>
                <h3 className="mb-4 font-serif text-xl font-bold text-primary-900">Cadastrar iniciativa</h3>
                <p className="mb-6 text-sm text-stone-600">
                  O cadastro será enviado para análise administrativa antes da publicação.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError ? <div className="rounded bg-red-50 p-3 text-sm text-red-600">{submitError}</div> : null}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Nome da instituição</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className="w-full rounded border border-stone-300 p-2 outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(event) => setFormData({ ...formData, category: event.target.value as Project['category'] })}
                      className="w-full rounded border border-stone-300 p-2 outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Contato</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(event) => setFormData({ ...formData, contact: event.target.value })}
                      className="w-full rounded border border-stone-300 p-2 outline-none"
                      placeholder="Telefone ou e-mail"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Endereço / Localização</label>
                    <input
                      required
                      type="text"
                      value={formData.address}
                      onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                      className="w-full rounded border border-stone-300 p-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">Descrição breve</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      className="w-full rounded border border-stone-300 p-2 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="motion-button w-full rounded bg-primary-600 py-2 font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar para analise'}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-stone-800">Enviado com sucesso</h3>
                <p className="mt-2 text-stone-600">Sua iniciativa foi registrada e seguirá para validação.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
