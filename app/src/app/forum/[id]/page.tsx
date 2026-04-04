'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Send, User, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';

type Reply = {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string; display_name: string | null; avatar_url: string | null };
};

type Topic = {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
  view_count: number;
  profiles: { full_name: string; display_name: string | null; avatar_url: string | null };
  forum_replies: Reply[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)} dias atrás`;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700">
      {name?.charAt(0)?.toUpperCase() || <User size={18} />}
    </div>
  );
}

export default function TopicoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchTopic() {
      try {
        const res = await fetch(`/api/forum/${id}`);
        const json = await res.json();
        if (!res.ok) { setError('Tópico não encontrado.'); return; }
        setTopic(json.topic);
      } catch {
        setError('Erro ao carregar o tópico.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTopic();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError('');
    if (!reply.trim()) { setReplyError('Escreva algo antes de responder.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      const json = await res.json();
      if (!res.ok) { setReplyError(json.error || 'Erro ao enviar resposta.'); return; }
      // Recarregar o tópico com a nova resposta
      const refreshed = await fetch(`/api/forum/${id}`);
      const refreshedJson = await refreshed.json();
      setTopic(refreshedJson.topic);
      setReply('');
    } catch {
      setReplyError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-stone-500">{error || 'Tópico não encontrado.'}</p>
        <Link href="/forum" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline">
          <ArrowLeft size={14} /> Voltar ao Fórum
        </Link>
      </div>
    );
  }

  const authorName = topic.profiles?.display_name || topic.profiles?.full_name || 'Membro';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Back */}
        <Link href="/forum" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900">
          <ArrowLeft size={16} /> Voltar ao Fórum
        </Link>

        {/* Tópico Principal */}
        <article className="mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Category */}
          <div className="border-b border-stone-100 bg-stone-50 px-8 py-4 flex items-center gap-3">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">{topic.category}</span>
            <span className="text-xs text-stone-400 flex items-center gap-1"><Clock size={12} /> {timeAgo(topic.created_at)}</span>
            <span className="ml-auto text-xs text-stone-400">{topic.view_count} visualizações</span>
          </div>

          <div className="p-8">
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-6">{topic.title}</h1>

            {/* Author */}
            <div className="mb-6 flex items-center gap-3">
              <Avatar name={authorName} url={topic.profiles?.avatar_url} />
              <div>
                <p className="text-sm font-bold text-stone-800">{authorName}</p>
                <p className="text-xs text-stone-400">Autor do tópico</p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
              {topic.content}
            </div>
          </div>
        </article>

        {/* Respostas */}
        <section>
          <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
            <MessageSquare size={20} className="text-primary-600" />
            {topic.forum_replies.length} {topic.forum_replies.length === 1 ? 'Resposta' : 'Respostas'}
          </h2>

          {topic.forum_replies.length > 0 ? (
            <div className="space-y-4 mb-8">
              {topic.forum_replies.map((rep) => {
                const repName = rep.profiles?.display_name || rep.profiles?.full_name || 'Membro';
                return (
                  <div key={rep.id} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={repName} url={rep.profiles?.avatar_url} />
                        <div>
                          <p className="text-sm font-bold text-stone-800">{repName}</p>
                          <p className="text-xs text-stone-400">{timeAgo(rep.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{rep.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-8 rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma resposta ainda. Seja o primeiro a contribuir!</p>
            </div>
          )}

          {/* Formulário de resposta */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h3 className="mb-4 font-bold text-stone-900 flex items-center gap-2">
              <Send size={18} className="text-primary-600" /> Deixar uma Resposta
            </h3>
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                ref={replyRef}
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={5}
                placeholder="Escreva sua resposta com respeito e clareza..."
                className="w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              {replyError && (
                <p className="text-sm text-red-600">{replyError}</p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex items-center gap-2 rounded-xl bg-stone-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                  ) : (
                    <><Send size={16} /> Enviar Resposta</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
