'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, Clock, ChevronRight, Plus, Loader2, Sparkles } from 'lucide-react';

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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Header Section */}
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-primary-500">
            <Sparkles size={14} /> Espaço de Diálogo
          </div>
          <h1 className="font-serif text-5xl font-bold text-primary-900 md:text-6xl text-balance">
            Fórum da Comunidade
          </h1>
          <p className="mt-4 text-xl text-primary-800/70 italic font-serif leading-relaxed">
            Compartilhe vitórias, peça orientações e fortaleça o laço com outras mulheres na busca pela ordem e virtude.
          </p>
        </div>
        <Link
          href="/forum/novo"
          className="group inline-flex items-center gap-3 rounded-full bg-primary-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-primary-800 hover:-translate-y-1 hover:shadow-2xl"
        >
          <Plus size={20} className="transition-transform group-hover:rotate-90" />
          Novo Diálogo
        </Link>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={48} className="animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="rounded-[32px] border border-red-100 bg-red-50/50 p-8 text-center text-red-600 shadow-sm">
          {error}
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-[42px] border border-dashed border-primary-200 bg-white/40 p-20 text-center backdrop-blur-sm shadow-[0_30px_70px_rgba(66,37,35,0.03)]">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary-50 text-primary-300">
            <MessageSquare size={40} />
          </div>
          <h3 className="font-serif text-3xl font-bold text-primary-900 mb-4 text-balance">Nenhum diálogo iniciado ainda</h3>
          <p className="text-lg text-primary-800/60 mb-10 max-w-md mx-auto">Seja a primeira a cultivar essa semente. Inicie uma discussão com a comunidade agora!</p>
          <Link
            href="/forum/novo"
            className="inline-flex items-center gap-3 rounded-full bg-primary-600 px-10 py-5 text-lg font-bold text-white transition-all hover:bg-primary-700 shadow-xl"
          >
            <Plus size={20} /> Começar o Primeiro Diálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {topics.map((topic) => {
            const authorName = topic.profiles?.display_name || topic.profiles?.full_name || 'Membro';
            const replyCount = topic.reply_count?.[0]?.count ?? 0;
            return (
              <Link
                key={topic.id}
                href={`/forum/${topic.id}`}
                className="group soft-card relative flex items-center justify-between p-8 transition-all hover:scale-[1.01] hover:border-primary-300/50 hover:shadow-[0_25px_60px_rgba(66,37,35,0.08)]"
              >
                <div className="flex items-start gap-6 min-w-0">
                  <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-fantasy text-primary-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                    <MessageSquare size={28} />
                  </div>
                  <div className="min-w-0 pr-4">
                    <h3 className="font-serif text-2xl font-bold text-primary-950 truncate group-hover:text-primary-700 transition-colors">
                      {topic.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-primary-800/60">
                      <span className="rounded-full bg-primary-50 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary-600">
                        {topic.category}
                      </span>
                      <span className="flex items-center gap-1.5">
                        por <span className="font-bold text-primary-900/80">{authorName}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {timeAgo(topic.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex shrink-0 items-center gap-8 text-primary-800/40">
                  <div className="hidden text-center sm:block">
                    <div className="flex items-center gap-1.5 font-serif text-lg font-bold text-primary-900/70">
                      <MessageSquare size={16} /> {replyCount}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em]">respostas</div>
                  </div>
                  <div className="hidden text-center md:block">
                    <div className="flex items-center gap-1.5 font-serif text-lg font-bold text-primary-900/70">
                      <Eye size={16} /> {topic.view_count}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Vistas</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fantasy text-primary-300 transition-all group-hover:bg-primary-900 group-hover:text-white">
                    <ChevronRight size={20} />
                  </div>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 h-16 w-16 opacity-0 transition-opacity group-hover:opacity-100 overflow-hidden rounded-tr-[24px]">
                    <div className="absolute -top-8 -right-8 h-16 w-16 rotate-45 bg-primary-100/30" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
