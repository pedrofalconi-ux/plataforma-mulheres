'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Newspaper, PlusCircle } from 'lucide-react';

type BlogPostItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    source: 'Portal',
    status: 'draft',
    scheduled_for: '',
  });

  async function fetchPosts() {
    setLoading(true);
    try {
      const [publishedRes, draftRes] = await Promise.all([
        fetch('/api/blog?status=published'),
        fetch('/api/blog?status=draft'),
      ]);

      const published = await publishedRes.json();
      const drafts = await draftRes.json();
      setPosts([...(Array.isArray(drafts) ? drafts : []), ...(Array.isArray(published) ? published : [])]);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar posts do blog.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        title: form.title.trim(),
        slug: `${slugify(form.title)}-${Date.now().toString().slice(-5)}`,
        summary: form.summary.trim() || null,
        content: form.content.trim() || null,
        image_url: null,
        status: form.status,
        category_id: null,
        source: form.source || 'Portal',
        scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
      };

      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao criar publicação');
      setMessage('Publicação criada com sucesso.');
      setForm({
        title: '',
        summary: '',
        content: '',
        source: 'Portal',
        status: 'draft',
        scheduled_for: '',
      });
      fetchPosts();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar publicação');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-900">Blog Engine</h1>
        <p className="text-stone-500">Publique artigos com status, SEO e agendamento de publicação.</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-900">
          <PlusCircle size={18} className="text-primary-700" />
          Nova publicação
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Fonte</label>
            <input
              value={form.source}
              onChange={(e) => setForm((prev) => ({ ...prev, source: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-stone-700">Agendar para (opcional)</label>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduled_for: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-stone-700">Resumo</label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-stone-700">Conteúdo</label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Criar publicação'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-stone-900">
          <Newspaper size={18} className="text-primary-700" />
          Publicações
        </h2>

        {loading ? (
          <div className="flex justify-center py-10 text-primary-700">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma publicação encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Agendamento</th>
                  <th className="px-4 py-3">Publicação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900">{post.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">{post.slug}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {post.scheduled_for
                        ? new Date(post.scheduled_for).toLocaleString('pt-BR')
                        : 'Sem agendamento'}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleString('pt-BR')
                        : 'Ainda não publicado'}
                    </td>
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
