'use client';

import React, { Suspense, useEffect, useState } from 'react';
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
  email: z.string().email('Digite um e-mail valido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
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

  const [activeMode, setActiveMode] = useState<LoginMode>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveMode(mode);
    setError('');
  }, [mode]);

  const isRegisterMode = activeMode === 'register' || activeMode === 'admin-register';
  const isAdminRegister = activeMode === 'admin-register';

  async function upgradeToAdmin() {
    const adminRes = await fetch('/api/auth/admin-upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });

    const adminData = await adminRes.json().catch(() => ({}));

    if (!adminRes.ok) {
      throw new Error(adminData.error || 'Nao foi possivel liberar o acesso administrativo.');
    }
  }

  function resetFormForMode(nextMode: LoginMode) {
    setActiveMode(nextMode);
    setError('');
    setPassword('');
    setSecretKey('');

    if (nextMode === 'login') {
      setName('');
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        loginSchema.parse({ email, password, name });

        if (!name.trim()) {
          throw new Error('Preencha seu nome completo para continuar.');
        }

        if (isAdminRegister && !secretKey.trim()) {
          throw new Error('Digite a chave de administrador para concluir o cadastro.');
        }

        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            fullName: name.trim(),
          }),
        });

        const registerData = await registerResponse.json().catch(() => ({}));

        if (!registerResponse.ok) {
          throw new Error(registerData.error || 'Nao foi possivel criar sua conta agora.');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

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

      if (signInError) {
        throw signInError;
      }

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
        setError(err.issues[0]?.message || 'Revise os dados informados.');
      } else {
        setError(err?.message || 'Nao foi possivel concluir agora. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F7F2ED] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#E7D8D8] bg-white shadow-[0_24px_80px_rgba(66,37,35,0.10)] lg:grid-cols-[1.02fr_0.98fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#422523] to-[#5D3A38] p-10 text-[#F7F2ED] lg:flex">
          <div>
            <BrandMark />
            <div className="mt-10">
              <span className="text-xs font-bold uppercase tracking-[0.32em] text-[#DBA1A2]">
                Acesso da aluna
              </span>
              <h1 className="mt-4 text-5xl font-serif leading-tight">
                Entre para viver a experiencia completa da plataforma.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-[#F7F2ED]/78">
                Conteudos, trilhas e encontros pensados para mulheres que desejam cultivar um lar
                com mais intencao, equilibrio e proposito.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-[#F7F2ED]/72">
              Depois do pagamento aprovado, basta criar sua conta uma unica vez e seguir para a
              plataforma.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>

            {isBought ? (
              <div className="mb-6 rounded-[26px] border border-[#DBA1A2]/20 bg-[#DBA1A2]/10 p-5">
                <div className="mb-2 flex items-center gap-3 text-[#DBA1A2]">
                  <CheckCircle2 size={22} />
                  <span className="text-base font-bold">Pagamento aprovado</span>
                </div>
                <p className="text-sm leading-relaxed text-[#422523]/72">
                  Sua vaga esta confirmada. Entre com sua conta ou crie seu cadastro para seguir
                  para a plataforma.
                </p>
              </div>
            ) : null}

            <span className="text-xs font-bold uppercase tracking-[0.32em] text-[#DBA1A2]">
              {isRegisterMode ? 'Criar cadastro' : 'Entrar'}
            </span>

            <h2 className="mt-3 text-[2.1rem] font-serif leading-[1.05] text-[#422523] sm:text-[2.6rem]">
              {isAdminRegister
                ? 'Crie seu acesso administrativo'
                : isRegisterMode
                  ? 'Crie sua conta e entre na plataforma'
                  : 'Acesse sua plataforma'}
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-[#422523]/68 sm:text-base">
              {isAdminRegister
                ? 'Preencha seus dados e valide a chave de administrador para liberar o painel.'
                : isRegisterMode
                  ? 'Informe seus dados para concluir o cadastro e seguir direto para a sua area.'
                  : 'Entre com seu e-mail e senha para continuar sua jornada com tranquilidade.'}
            </p>

            {isAdminRegister ? (
              <div className="mt-6 rounded-[24px] border border-[#422523]/10 bg-[#F7F2ED] px-4 py-4 text-sm leading-6 text-[#422523]/72">
                Este acesso e reservado para administracao da plataforma.
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 flex items-start gap-3 rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isRegisterMode ? (
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-[#422523]/80">Nome completo</label>
                  <div className="group relative">
                    <UserIcon
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/28 transition-colors group-focus-within:text-[#DBA1A2]"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-[22px] border border-[#E7D8D8] bg-[#F7F2ED]/55 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="ml-1 text-sm font-medium text-[#422523]/80">E-mail</label>
                <div className="group relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/28 transition-colors group-focus-within:text-[#DBA1A2]"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[22px] border border-[#E7D8D8] bg-[#F7F2ED]/55 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                    placeholder="voce@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-medium text-[#422523]/80">Senha</label>
                <div className="group relative">
                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/28 transition-colors group-focus-within:text-[#DBA1A2]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[22px] border border-[#E7D8D8] bg-[#F7F2ED]/55 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                    placeholder={isRegisterMode ? 'Crie uma senha segura' : 'Digite sua senha'}
                    required
                  />
                </div>
              </div>

              {isAdminRegister ? (
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-medium text-[#422523]/80">
                    Chave de administrador
                  </label>
                  <div className="group relative">
                    <ShieldCheck
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#422523]/28 transition-colors group-focus-within:text-[#DBA1A2]"
                    />
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="w-full rounded-[22px] border border-[#E7D8D8] bg-[#F7F2ED]/55 py-4 pl-12 pr-4 text-[#422523] outline-none transition-all focus:border-[#DBA1A2] focus:ring-4 focus:ring-[#DBA1A2]/10"
                      placeholder="Digite a chave de administrador"
                      required
                    />
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#DBA1A2] py-4 text-sm font-bold text-white shadow-lg shadow-[#DBA1A2]/30 transition-all hover:bg-[#D48F90] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : isAdminRegister ? (
                  'Criar acesso administrativo'
                ) : isRegisterMode ? (
                  'Criar conta e continuar'
                ) : (
                  'Entrar na plataforma'
                )}
              </button>
            </form>

            <div className="mt-7 space-y-3 text-center text-sm leading-6 text-[#422523]/64">
              {!isRegisterMode ? (
                <>
                  <p>
                    Ainda nao tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => resetFormForMode('register')}
                      className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline"
                    >
                      Faca cadastro
                    </button>
                  </p>
                  <p>
                    Area administrativa?{' '}
                    <button
                      type="button"
                      onClick={() => resetFormForMode('admin-register')}
                      className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline"
                    >
                      Inserir chave de administrador
                    </button>
                  </p>
                </>
              ) : (
                <p>
                  Ja tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => resetFormForMode('login')}
                    className="font-bold text-[#DBA1A2] underline-offset-4 hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              )}

              {activeMode !== mode ? (
                <p>
                  Preferir abrir em uma pagina separada?{' '}
                  <Link
                    href={
                      activeMode === 'admin-register'
                        ? '/cadastro/admin?bought=true'
                        : activeMode === 'register'
                          ? '/cadastro?bought=true'
                          : '/login'
                    }
                    className="font-bold text-[#422523] underline-offset-4 hover:underline"
                  >
                    Abrir esta etapa
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
      fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F2ED]">Carregando...</div>}
    >
      <FormContent mode={mode} />
    </Suspense>
  );
}
