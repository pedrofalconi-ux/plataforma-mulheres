'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

const FORUM_CATEGORIES = [
  'Bioética Clínica',
  'Doutrina Social da Igreja',
  'Gestão Social',
  'Espiritualidade',
  'Formação Acadêmica',
  'Dúvidas do Curso',
  'Outros',
];

export default function NovoTopicoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', category: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.category || !form.content.trim()) {
      setError('Por favor, preencha todos os campos antes de publicar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Erro ao publicar o tópico. Tente novamente.');
        return;
      }

      router.push(`/forum/${json.topic.id}`);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/forum"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft size={16} /> Voltar ao Fórum
          </Link>
          <h1 className="font-serif text-4xl font-bold text-stone-900">Novo Tópico</h1>
          <p className="mt-2 text-stone-500">
            Compartilhe sua dúvida ou reflexão com a comunidade. Seja respeitoso e construtivo.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-bold text-stone-700">
                Título do Tópico <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Escreva um título claro e objetivo..."
                maxLength={150}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              <p className="mt-1 text-right text-xs text-stone-400">{form.title.length}/150</p>
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-bold text-stone-700">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Selecione uma categoria...</option>
                {FORUM_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Conteúdo */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-bold text-stone-700">
                Descrição / Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Descreva sua dúvida ou reflexão com detalhes. Quanto mais contexto você der, mais fácil será para a comunidade ajudar..."
                rows={10}
                className="w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/forum"
              className="rounded-xl border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 rounded-xl bg-stone-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Publicando...</>
              ) : (
                <><MessageSquare size={18} /> Publicar Tópico</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
