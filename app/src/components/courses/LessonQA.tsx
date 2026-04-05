'use client';

import React, { useEffect, useState } from 'react';
import { Send, MessageCircle, User as UserIcon, Loader2, CornerDownRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: Profile;
}

export default function LessonQA({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`);
      if (res.ok) {
        const { comments: data } = await res.json();
        setComments(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar duvidas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      void fetchComments();
    }
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          replyTo
            ? {
                content: newComment,
                parentId: replyTo,
              }
            : {
                content: newComment,
              },
        ),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || 'Nao foi possivel publicar seu comentario.');
      }

      const { comment } = await res.json();
      setComments((current) => [...current, comment]);
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Erro ao postar duvida:', err);
      setSubmitError(err instanceof Error ? err.message : 'Nao foi possivel publicar seu comentario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rootComments = comments.filter((comment) => !comment.parent_id);
  const getReplies = (parentId: string) => comments.filter((comment) => comment.parent_id === parentId);

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-stone-900">
        <MessageCircle size={24} className="text-primary-600" /> Duvidas e Discussao
      </h3>

      <div className="mb-8 space-y-6">
        {rootComments.length === 0 ? (
          <p className="rounded-lg bg-stone-50 py-6 text-center text-stone-500">
            Nenhuma duvida enviada ainda. Seja o primeiro a perguntar!
          </p>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200">
                  {comment.profiles.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-stone-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="relative rounded-xl rounded-tl-none bg-stone-50 p-4">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2 font-bold text-stone-800">
                        {comment.profiles.full_name}
                        {comment.profiles.role?.toLowerCase() === 'admin' ? (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-800">
                            Professor
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{comment.content}</p>

                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setReplyTo(comment.id);
                          setSubmitError('');
                        }}
                        className="text-xs font-semibold text-primary-600 opacity-0 transition-opacity hover:text-primary-800 group-hover:opacity-100"
                      >
                        Responder
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {getReplies(comment.id).map((reply) => (
                      <div key={reply.id} className="flex gap-3 pl-4">
                        <CornerDownRight size={16} className="mt-2 text-stone-300" />
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200">
                          {reply.profiles.avatar_url ? (
                            <img src={reply.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon size={16} className="text-stone-500" />
                          )}
                        </div>
                        <div className="flex-1 rounded-lg bg-stone-100/70 p-3">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-stone-800">{reply.profiles.full_name}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-stone-600">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {replyTo === comment.id ? (
                    <form onSubmit={handleSubmit} className="mt-3 flex gap-2 pl-8">
                      <input
                        autoFocus
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Respondendo ${comment.profiles.full_name}...`}
                        className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="rounded-lg bg-primary-600 px-4 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setNewComment('');
                          setSubmitError('');
                        }}
                        className="px-2 text-xs text-stone-500"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {submitError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      {user ? (
        !replyTo ? (
          <form onSubmit={handleSubmit} className="flex items-start gap-4 border-t border-stone-100 pt-6">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-800">
              {user.name.charAt(0)}
            </div>
            <div className="relative flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ficou com alguma duvida nesta aula? Envie aqui..."
                className="min-h-[100px] w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 pr-12 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="absolute bottom-3 right-3 rounded-lg bg-primary-600 p-2 text-white shadow-sm transition-colors hover:bg-primary-700 disabled:bg-stone-400 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        ) : null
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">Voce precisa estar logado para enviar duvidas.</p>
        </div>
      )}
    </div>
  );
}
