'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, Clock, ChevronRight, Plus, Loader2 } from 'lucide-react';

type Topic = {
  id: string;
  title: string;
  category: string;
  created_at: string;
  view_count: number;
  profiles: { full_name: string; display_name: string | null } | null;
  reply_count: { count: number }[];
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

export default function ForumView() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch('/api/forum');
        const json = await res.json();
        if (!res.ok) { setError('Não foi possível carregar os tópicos.'); return; }
        setTopics(json.topics || []);
      } catch {
        setError('Erro de conexão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Fórum da Comunidade</h1>
          <p className="mt-1 text-sm text-stone-500">Participe das discussões e compartilhe seu conhecimento.</p>
        </div>
        <Link
          href="/forum/novo"
          className="group flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          Novo Tópico
        </Link>
      </div>

      {/* Estado de carregamento */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-stone-300" />
          <h3 className="font-bold text-stone-700 mb-2">Nenhum tópico ainda</h3>
          <p className="text-sm text-stone-500 mb-6">Seja o primeiro a criar uma discussão na comunidade!</p>
          <Link
            href="/forum/novo"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-600"
          >
            <Plus size={16} /> Criar o Primeiro Tópico
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden divide-y divide-stone-100">
          {topics.map((topic) => {
            const authorName = topic.profiles?.display_name || topic.profiles?.full_name || 'Membro';
            const replyCount = topic.reply_count?.[0]?.count ?? 0;
            return (
              <Link
                key={topic.id}
                href={`/forum/${topic.id}`}
                className="group flex items-center justify-between p-6 transition-colors hover:bg-stone-50"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-1 shrink-0 text-stone-300 group-hover:text-primary-500 transition-colors">
                    <MessageSquare size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-stone-800 truncate group-hover:text-primary-700 transition-colors">
                      {topic.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 font-medium text-stone-600">
                        {topic.category}
                      </span>
                      <span>por <span className="font-semibold text-stone-700">{authorName}</span></span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(topic.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex shrink-0 items-center gap-6 text-stone-500">
                  <div className="hidden text-center sm:block">
                    <div className="flex items-center gap-1 font-bold text-stone-700">
                      <MessageSquare size={14} /> {replyCount}
                    </div>
                    <div className="text-xs">respostas</div>
                  </div>
                  <div className="hidden text-center md:block">
                    <div className="flex items-center gap-1 font-bold text-stone-700">
                      <Eye size={14} /> {topic.view_count}
                    </div>
                    <div className="text-xs">vistos</div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
