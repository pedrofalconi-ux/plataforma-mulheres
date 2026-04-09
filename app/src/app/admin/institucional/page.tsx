'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';

type InstitutionalState = {
  hero_title: string;
  hero_subtitle: string;
  about_summary: string;
  mission: string;
  vision: string;
  values: string[];
  whatsapp_group_url: string;
};

const initialState: InstitutionalState = {
  hero_title: '',
  hero_subtitle: '',
  about_summary: '',
  mission: '',
  vision: '',
  values: [],
  whatsapp_group_url: '',
};

export default function AdminInstitucionalPage() {
  const [state, setState] = useState<InstitutionalState>(initialState);
  const [valuesInput, setValuesInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      setError('');
      setWarning('');
      try {
        const res = await fetch('/api/institucional');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar conteúdo institucional');

        const nextState: InstitutionalState = {
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          about_summary: data.about_summary || '',
          mission: data.mission || '',
          vision: data.vision || '',
          values: Array.isArray(data.values) ? data.values : [],
          whatsapp_group_url: data.whatsapp_group_url || '',
        };
        setState(nextState);
        setValuesInput(nextState.values.join('\n'));
        if (data.warning) {
          setWarning(data.warning);
        }
      } catch (err: any) {
        setError(err?.message || 'Falha ao carregar conteúdo institucional');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const values = valuesInput
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = {
        ...state,
        values,
      };

      const res = await fetch('/api/institucional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar conteúdo institucional');

      setMessage('Conteúdo institucional atualizado com sucesso.');
      setState({
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        about_summary: data.about_summary || '',
        mission: data.mission || '',
        vision: data.vision || '',
        values: Array.isArray(data.values) ? data.values : [],
        whatsapp_group_url: data.whatsapp_group_url || '',
      });
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar conteúdo institucional');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-primary-700">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Painel Institucional (CMS)</h1>
        <p className="text-stone-500">Gerencie Missão, Visão, Valores e textos institucionais da plataforma.</p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {warning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Título principal</label>
            <input
              type="text"
              value={state.hero_title}
              onChange={(e) => setState((prev) => ({ ...prev, hero_title: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Subtítulo principal</label>
            <input
              type="text"
              value={state.hero_subtitle}
              onChange={(e) => setState((prev) => ({ ...prev, hero_subtitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-stone-700">Resumo institucional</label>
          <textarea
            rows={4}
            value={state.about_summary}
            onChange={(e) => setState((prev) => ({ ...prev, about_summary: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Missão</label>
            <textarea
              rows={5}
              value={state.mission}
              onChange={(e) => setState((prev) => ({ ...prev, mission: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Visão</label>
            <textarea
              rows={5}
              value={state.vision}
              onChange={(e) => setState((prev) => ({ ...prev, vision: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-stone-700">Link do grupo de WhatsApp</label>
          <input
            type="url"
            value={state.whatsapp_group_url}
            onChange={(e) => setState((prev) => ({ ...prev, whatsapp_group_url: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="mt-2 text-xs text-stone-500">
            Se preenchido, as alunas verão um botão para entrar no grupo diretamente pelo perfil.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-stone-700">Valores (um por linha)</label>
          <textarea
            rows={6}
            value={valuesInput}
            onChange={(e) => setValuesInput(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div className="flex justify-end border-t border-stone-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar conteúdo institucional
          </button>
        </div>
      </form>
    </div>
  );
}
