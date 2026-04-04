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

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
    <div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-[#E7D8D8]">
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
                Um espaco de aprendizado, clareza e direcao para mulheres que desejam uma rotina mais intencional.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm italic text-[#E7D8D8]/60">
              &quot;Honrar sua historia e o primeiro passo para construir seu legado.&quot;
            </p>
          </div>
        </div>

        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="lg:hidden mb-8">
              <BrandMark />
            </div>

            {mode === 'register' && isBought ? (
              <div className="mb-8 p-6 bg-[#DBA1A2]/10 border border-[#DBA1A2]/20 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-3 text-[#DBA1A2] mb-2">
                  <CheckCircle2 size={24} />
                  <span className="font-bold text-lg">Parabens pela sua compra!</span>
                </div>
                <p className="text-[#422523]/70 text-sm leading-relaxed">
                  Finalize seu cadastro abaixo para acessar suas trilhas agora mesmo.
                </p>
              </div>
            ) : null}

            <h2 className="text-3xl font-serif font-medium text-[#422523]">
              {mode === 'login'
                ? 'Entrar na area da aluna'
                : isAdminRegister
                  ? 'Criar acesso administrativo'
                  : 'Comecar minha jornada'}
            </h2>

            <p className="mt-3 text-[#422523]/60">
              {mode === 'login'
                ? 'Retome seu progresso e conecte-se com a comunidade.'
                : isAdminRegister
                  ? 'Crie sua conta admin e valide a chave mestra para liberar o painel.'
                  : 'Crie sua conta e acesse os cursos e materiais em PDF.'}
            </p>

            {isAdminRegister ? (
              <div className="mt-6 border border-[#422523]/12 bg-[#F7F2ED] px-4 py-4 text-sm text-[#422523]/72">
                Esse acesso libera o painel administrativo da plataforma. Use a chave admin do projeto para concluir.
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              {mode !== 'login' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#422523]/80 ml-1">Nome completo</label>
                  <div className="relative group">
                    <UserIcon
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                      placeholder="Como voce prefere ser chamada?"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#422523]/80 ml-1">Seu melhor e-mail</label>
                <div className="relative group">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors"
                  />
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
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </div>

              {isAdminRegister ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#422523]/80 ml-1">Chave admin</label>
                  <div className="relative group">
                    <ShieldCheck
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/30 group-focus-within:text-[#DBA1A2] transition-colors"
                    />
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="w-full bg-[#F7F2ED]/50 border border-[#E7D8D8] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10 transition-all text-[#422523]"
                      placeholder="Digite a chave de admin"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#DBA1A2] hover:bg-[#D48F90] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#DBA1A2]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
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
              <p className="text-[#422523]/60 text-sm">
                {mode === 'login' ? 'Ainda nao faz parte?' : 'Ja tem uma conta?'}{' '}
                <Link
                  href={mode === 'login' ? '/cadastro' : '/login'}
                  className="text-[#DBA1A2] font-bold hover:underline underline-offset-4"
                >
                  {mode === 'login' ? 'Inscreva-se aqui' : 'Faca login'}
                </Link>
              </p>

              {mode === 'login' ? (
                <p className="mt-3 text-[#422523]/60 text-sm">
                  Precisa entrar como administradora?{' '}
                  <Link
                    href="/cadastro/admin"
                    className="text-[#DBA1A2] font-bold hover:underline underline-offset-4"
                  >
                    Criar acesso admin
                  </Link>
                </p>
              ) : null}
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
      fallback={<div className="min-h-screen bg-[#F7F2ED] flex items-center justify-center">Carregando...</div>}
    >
      <FormContent mode={mode} />
    </Suspense>
  );
}
