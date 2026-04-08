'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { z } from 'zod';
import { BRAND_NAME } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  name: z.string().optional(),
});

type LoginMode = 'login' | 'register' | 'admin-register';

function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DBA1A2] text-white shadow-xl">
      <Heart size={28} fill="currentColor" />
    </div>
  );
}

function FormContent({ mode = 'login' }: { mode?: LoginMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isBought = searchParams.get('bought') === 'true';
  const isAdminRegister = mode === 'admin-register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function upgradeToAdmin() {
    const adminRes = await fetch('/api/auth/admin-upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });

    const adminData = await adminRes.json().catch(() => ({}));
    if (!adminRes.ok) {
      throw new Error(adminData.error || 'Erro ao liberar acesso de administrador');
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register' || isAdminRegister) {
        loginSchema.parse({ email, password, name });
        if (!name.trim()) throw new Error('Nome e obrigatorio no cadastro');
        if (isAdminRegister && !secretKey.trim()) {
          throw new Error('A chave admin e obrigatoria');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (signUpError) throw signUpError;

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (isAdminRegister) {
          await upgradeToAdmin();
        }

        router.push(isAdminRegister ? '/admin' : '/trilhas');
        router.refresh();
        return;
      }

      loginSchema.parse({ email, password });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        router.push(profile?.role?.toLowerCase() === 'admin' ? '/admin' : '/trilhas');
        router.refresh();
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Dados invalidos');
      } else {
        setError(err?.message || 'Credenciais invalidas ou erro no sistema.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F2ED] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[40px] border border-[#E7D8D8] bg-white shadow-2xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#422523] to-[#5D3A38] p-12 text-[#F7F2ED] lg:flex">
          <div>
            <BrandMark />
            <div className="mt-12">
              <span className="text-sm font-bold uppercase tracking-widest text-[#DBA1A2]">Boas-vindas</span>
              <h1 className="mt-4 text-5xl font-serif font-medium leading-tight">
                Plataforma <br />
                {BRAND_NAME}
              </h1>
              <p className="mt-6 max-w-sm text-lg leading-relaxed text-[#E7D8D8]/80">
                Um espaco de aprendizado, clareza e direcao para mulheres que desejam uma rotina mais intencional.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm italic text-[#E7D8D8]/60">
              &quot;Honrar sua historia e o primeiro passo para construir seu legado.&quot;
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 md:p-16">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link
                href="/login"
                className={`rounded-2xl border px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
                  mode === 'login'
                    ? 'border-[#422523] bg-[#422523] text-white'
                    : 'border-[#E7D8D8] bg-white text-[#422523]/70 hover:border-[#DBA1A2] hover:text-[#422523]'
                }`}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro?bought=true"
                className={`rounded-2xl border px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
                  mode === 'register'
                    ? 'border-[#422523] bg-[#422523] text-white'
                    : 'border-[#E7D8D8] bg-white text-[#422523]/70 hover:border-[#DBA1A2] hover:text-[#422523]'
                }`}
              >
                Cadastrar-se
              </Link>
              <Link
                href="/cadastro/admin?bought=true"
                className={`rounded-2xl border px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
                  mode === 'admin-register'
                    ? 'border-[#422523] bg-[#422523] text-white'
                    : 'border-[#E7D8D8] bg-white text-[#422523]/70 hover:border-[#DBA1A2] hover:text-[#422523]'
                }`}
              >
                Chave admin
              </Link>
            </div>

            {mode === 'login' && isBought ? (
              <div className="animate-in slide-in-from-top-4 mb-8 rounded-3xl border border-[#DBA1A2]/20 bg-[#DBA1A2]/10 p-6 duration-700 fade-in">
                <div className="mb-2 flex items-center gap-3 text-[#DBA1A2]">
                  <CheckCircle2 size={24} />
                  <span className="text-lg font-bold">Parabens, bem-vinda!</span>
                </div>
                <p className="text-sm leading-relaxed text-[#422523]/70">
                  Bem-vinda a uma das maiores comunidades femininas da Paraiba. Se este for seu primeiro acesso, finalize seu cadastro para entrar na plataforma.
                </p>
                <Link
                  href="/cadastro?bought=true"
                  className="mt-5 flex w-full items-center justify-center rounded-2xl border border-[#422523]/12 bg-white px-4 py-3 text-sm font-bold text-[#422523] transition-all hover:border-[#DBA1A2]/30 hover:text-[#DBA1A2]"
                >
                  Fazer cadastro
                </Link>
              </div>
            ) : null}

            {mode !== 'login' && isBought ? (
              <div className="animate-in slide-in-from-top-4 mb-8 rounded-3xl border border-[#DBA1A2]/20 bg-[#DBA1A2]/10 p-6 duration-700 fade-in">
                <div className="mb-2 flex items-center gap-3 text-[#DBA1A2]">
                  <CheckCircle2 size={24} />
                  <span className="text-lg font-bold">Parabens, bem-vinda!</span>
                </div>
                <p className="text-sm leading-relaxed text-[#422523]/70">
                  Finalize seu cadastro abaixo para acessar a plataforma com os dados da sua compra aprovada.
                </p>
              </div>
            ) : null}

            <h2 className="text-3xl font-serif font-medium text-[#422523]">
              {mode === 'login'
                ? 'Entrar na area da aluna'
                : isAdminRegister
                  ? 'Criar acesso administrativo'
                  : 'Crie sua conta e entre na comunidade'}
            </h2>

            <p className="mt-3 text-[#422523]/60">
              {mode === 'login'
                ? 'Entre com seus dados para retomar o progresso e acessar seus conteudos.'
                : isAdminRegister
                  ? 'Crie sua conta admin e valide a chave mestra para liberar o painel.'
                  : 'Complete seus dados para acessar cursos, materiais e encontros da plataforma.'}
            </p>

            {isAdminRegister ? (
              <div className="mt-6 border border-[#422523]/12 bg-[#F7F2ED] px-4 py-4 text-sm text-[#422523]/72">
                Esse acesso libera o painel administrativo da plataforma. Use a chave admin do projeto para concluir.
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              {mode !== 'login' ? (
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-[#422523]/80">Nome completo</label>
                  <div className="group relative">
                    <UserIcon
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 transition-colors group-focus-within:text-[#DBA1A2]"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-[#E7D8D8] bg-[#F7F2ED]/50 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                      placeholder="Como voce prefere ser chamada?"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="ml-1 text-sm font-medium text-[#422523]/80">Seu melhor e-mail</label>
                <div className="group relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 transition-colors group-focus-within:text-[#DBA1A2]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-[#E7D8D8] bg-[#F7F2ED]/50 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-medium text-[#422523]/80">Sua senha</label>
                <div className="group relative">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 transition-colors group-focus-within:text-[#DBA1A2]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-[#E7D8D8] bg-[#F7F2ED]/50 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </div>

              {isAdminRegister ? (
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-[#422523]/80">Chave admin</label>
                  <div className="group relative">
                    <ShieldCheck
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 transition-colors group-focus-within:text-[#DBA1A2]"
                    />
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="w-full rounded-2xl border border-[#E7D8D8] bg-[#F7F2ED]/50 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                      placeholder="Digite a chave de admin"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DBA1A2] py-4 font-bold text-white shadow-lg shadow-[#DBA1A2]/30 transition-all active:scale-[0.98] hover:bg-[#D48F90] disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : mode === 'login' ? (
                  'Entrar agora'
                ) : isAdminRegister ? (
                  'Criar conta admin'
                ) : (
                  'Criar minha conta'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              {mode === 'login' ? (
                <div className="space-y-3 text-sm text-[#422523]/60">
                  <p>Ainda não tem conta? Você pode se cadastrar agora.</p>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link href="/cadastro?bought=true" className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline">
                      Criar conta
                    </Link>
                    <Link href="/cadastro/admin?bought=true" className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline">
                      Inserir chave de administrador
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#422523]/60">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline">
                    Faça login
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm({ mode = 'login' }: { mode?: LoginMode }) {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F2ED]">Carregando...</div>}
    >
      <FormContent mode={mode} />
    </Suspense>
  );
}
