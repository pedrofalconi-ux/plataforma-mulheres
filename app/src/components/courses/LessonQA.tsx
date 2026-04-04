'use client';

import React, { useState, useEffect } from 'react';
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

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`);
      if (res.ok) {
        const { comments: data } = await res.json();
        setComments(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dúvidas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchComments();
    }
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyTo
        })
      });

      if (res.ok) {
        const { comment } = await res.json();
        setComments([...comments, comment]);
        setNewComment('');
        setReplyTo(null);
      }
    } catch (err) {
      console.error('Erro ao postar dúvida:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organizer: roots vs replies
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  if (loading) {
    return (
      <div className="py-8 flex justify-center text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 mt-6">
      <h3 className="text-xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
        <MessageCircle size={24} className="text-primary-600" /> Dúvidas e Discussões
      </h3>

      <div className="space-y-6 mb-8">
        {rootComments.length === 0 ? (
          <p className="text-stone-500 text-center py-6 bg-stone-50 rounded-lg">
            Nenhuma dúvida enviada ainda. Seja o primeiro a perguntar!
          </p>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {comment.profiles.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-stone-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-stone-50 p-4 rounded-xl rounded-tl-none relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-stone-800 flex items-center gap-2">
                        {comment.profiles.full_name} 
                        {comment.profiles.role === 'ADMIN' && <span className="bg-primary-100 text-primary-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Professor</span>}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-stone-700 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                    
                    {/* Reply Action */}
                    <div className="mt-2">
                      <button 
                        onClick={() => setReplyTo(comment.id)} 
                        className="text-xs font-semibold text-primary-600 hover:text-primary-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Responder
                      </button>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  <div className="mt-3 space-y-3">
                    {getReplies(comment.id).map(reply => (
                      <div key={reply.id} className="flex gap-3 pl-4">
                        <CornerDownRight size={16} className="text-stone-300 mt-2" />
                        <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {reply.profiles.avatar_url ? (
                            <img src={reply.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={16} className="text-stone-500" />
                          )}
                        </div>
                        <div className="bg-stone-100/70 p-3 rounded-lg flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-stone-800 text-sm">{reply.profiles.full_name}</span>
                          </div>
                          <p className="text-stone-600 whitespace-pre-wrap text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inline Reply Input */}
                  {replyTo === comment.id && (
                    <form onSubmit={handleSubmit} className="mt-3 pl-8 flex gap-2">
                      <input 
                        autoFocus
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Respondendo ${comment.profiles.full_name}...`}
                        className="flex-1 text-sm bg-white border border-stone-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                      <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-primary-600 text-white rounded-lg px-4 hover:bg-primary-700 disabled:opacity-50">
                        <Send size={16} />
                      </button>
                      <button type="button" onClick={() => { setReplyTo(null); setNewComment(''); }} className="text-stone-500 text-xs px-2">Cancelar</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        !replyTo && (
          <form onSubmit={handleSubmit} className="flex gap-4 items-start border-t border-stone-100 pt-6">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-800 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ficou com alguma dúvida nesta aula? Envie aqui..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 pr-12 focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all resize-none min-h-[100px]"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:bg-stone-400 transition-colors shadow-sm"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-amber-800 text-sm font-medium">Você precisa estar logado para enviar dúvidas.</p>
        </div>
      )}
    </div>
  );
}
