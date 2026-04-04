'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, AlertCircle, User as UserIcon, Heart, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { BRAND_NAME } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  name: z.string().optional()
});

function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DBA1A2] text-white shadow-xl">
      <Heart size={28} fill="currentColor" />
    </div>
  );
}

function FormContent({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isBought = searchParams.get('bought') === 'true';

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
    <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-[#E7D8D8]">
        {/* Left Side: Brand Experience */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#422523] to-[#5D3A38] text-[#F7F2ED]">
          <div>
            <BrandMark />
            <div className="mt-12">
              <span className="text-[#DBA1A2] text-sm font-bold tracking-widest uppercase">Boas-vindas</span>
              <h1 className="mt-4 text-5xl font-serif font-medium leading-tight">
                Plataforma <br />
                {BRAND_NAME}
              </h1>
              <p className="mt-6 text-lg text-[#E7D8D8]/80 leading-relaxed max-w-sm">
                Um espaço sagrado para sua evolução, onde o conhecimento encontra o acolhimento.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm italic text-[#E7D8D8]/60">
              &quot;Honrar sua história é o primeiro passo para construir seu legado.&quot;
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="lg:hidden mb-8">
              <BrandMark />
            </div>
            
            {mode === 'register' && isBought && (
              <div className="mb-8 p-6 bg-[#DBA1A2]/10 border border-[#DBA1A2]/20 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 text-[#DBA1A2] mb-2">
                  <CheckCircle2 size={24} />
                  <span className="font-bold text-lg">Parabéns pela sua compra!</span>
                </div>
                <p className="text-[#422523]/70 text-sm leading-relaxed">
                  Sua jornada acaba de começar. Finalize seu cadastro abaixo para acessar suas trilhas agora mesmo.
                </p>
              </div>
            )}

            <h2 className="text-3xl font-serif font-medium text-[#422523]">
              {mode === 'login' ? 'Entrar na área da aluna' : 'Começar minha jornada'}
            </h2>
            <p className="mt-3 text-[#422523]/60">
              {mode === 'login' 
                ? 'Retome seu progresso e conecte-se com a comunidade.' 
                : 'Crie sua conta e acesse conteúdos exclusivos selecionados para você.'}
            </p>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#422523]/80 ml-1">Nome completo</label>
                  <div className="relative group">
                    <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                      placeholder="Como você prefere ser chamada?"
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#422523]/80 ml-1">Seu melhor e-mail</label>
                <div className="relative group">
                  <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#422523]/80 ml-1">Sua senha</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#DBA1A2] hover:bg-[#D48F90] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#DBA1A2]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar agora' : 'Criar minha conta'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#422523]/60 text-sm">
                {mode === 'login' ? 'Ainda não faz parte?' : 'Já tem uma conta?'}{' '}
                <Link 
                  href={mode === 'login' ? '/cadastro' : '/login'} 
                  className="text-[#DBA1A2] font-bold hover:underline underline-offset-4"
                >
                  {mode === 'login' ? 'Inscreva-se aqui' : 'Faça login'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">Carregando...</div>}>
      <FormContent mode={mode} />
    </Suspense>
  );
}
