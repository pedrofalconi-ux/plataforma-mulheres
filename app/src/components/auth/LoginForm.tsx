'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, AlertCircle, User as UserIcon, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { BRAND_NAME } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  name: z.string().optional()
});

function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#2f9464,#163f2e)] text-white shadow-[0_18px_40px_rgba(22,63,46,0.25)]">
      <span className="font-serif text-2xl font-bold">D</span>
    </div>
  );
}

export default function LoginForm({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        loginSchema.parse({ email, password, name });
        if (!name || name.trim().length === 0) throw new Error('Nome é obrigatório no cadastro');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });

        if (signUpError) throw signUpError;

        const userId = signUpData.user?.id;
        if (userId) {
          const profileRes = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              fullName: name,
              email,
              role: 'student',
            }),
          });

          if (!profileRes.ok) {
            const errData = await profileRes.json();
            console.error('Erro ao criar perfil:', errData);
          }
        }

        router.push('/trilhas');
        router.refresh();
      } else {
        loginSchema.parse({ email, password });

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role === 'ADMIN' || profile?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/trilhas');
          }
          router.refresh();
        }
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
      } else {
        setError(err.message || 'Credenciais inválidas ou erro no sistema.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="motion-shell px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-6xl overflow-hidden rounded-[36px] border border-primary-900/10 bg-white/70 shadow-[0_30px_90px_rgba(21,32,25,0.08)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hero-sheen motion-float flex flex-col justify-between p-8 text-white sm:p-10">
          <div>
            <BrandMark />
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.22em] text-primary-100">Nova identidade</p>
            <h1 className="mt-4 text-5xl font-bold leading-tight">{BRAND_NAME}</h1>
            <p className="mt-4 max-w-md text-base leading-8 text-primary-100">
              Uma plataforma com presença mais calma, linguagem mais acolhedora e jornadas mais gostosas de acompanhar.
            </p>
          </div>

          <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-100">
              <Sparkles size={16} />
              experiência redesenhada
            </div>
            <p className="mt-3 text-xl font-serif font-bold">
              Entre para uma área de aprendizagem com mais clareza visual e menos fricção.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="motion-card mx-auto max-w-md">
            <h2 className="text-4xl font-bold text-stone-900">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {mode === 'login'
                ? `Acesse a ${BRAND_NAME} para continuar suas jornadas, revisar progresso e retomar o que importa.`
                : `Abra sua conta na ${BRAND_NAME} e entre em uma experiência mais humana de formação e comunidade.`}
            </p>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Nome completo</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-primary-900/10 bg-white px-12 py-3.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                      placeholder="Seu nome completo"
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-700">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-primary-900/10 bg-white px-12 py-3.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-700">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-primary-900/10 bg-white px-12 py-3.5 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="motion-button inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800 disabled:opacity-70"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'login' ? 'Entrar na plataforma' : 'Criar minha conta')}
              </button>
            </form>

            <div className="mt-6 text-sm text-stone-600">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
              <Link href={mode === 'login' ? '/cadastro' : '/login'} className="motion-button font-bold text-primary-700 hover:text-primary-900">
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
