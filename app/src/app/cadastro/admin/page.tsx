'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function AdminUpgradePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [secret, setSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Se estiver carregando auth state global
  if (loading) {
    return <div className="min-h-screen flex text-stone-400 items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  }

  // Se não estiver logado, obriga a logar ou se cadastrar primeiro
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-amber-100 text-amber-800 p-4 rounded-xl mb-6 text-sm font-bold text-center border border-amber-200">
            Acesso Restrito: Faça login ou cadastre-se primeiro para vincular a conta de Administrador.
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  // Se já for admin
  if (user.role === 'ADMIN' || user.role === 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center flex-col p-4 text-center">
        <ShieldCheck size={64} className="text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Você já é um Administrador!</h1>
        <p className="text-stone-600 mb-8 max-w-sm">Seu perfil já possui privilégios máximos no Ecossistema da Dignidade.</p>
        <button onClick={() => router.push('/admin/cursos')} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-700 transition-colors">
          Ir para Painel Admin <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/admin-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secret })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao promover.');
      }

      setSuccess(true);
      
      // Redirect hard so context re-fetches
      setTimeout(() => {
        window.location.href = '/admin/cursos';
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-900 items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <KeyRound size={32} className="text-stone-800" />
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-center text-stone-900 mb-2">Acesso Privilegiado</h1>
        <p className="text-stone-500 text-center mb-8 text-sm leading-relaxed">
          Conta atual: <strong className="text-stone-800">{user.email}</strong><br/>
          Insira a chave mestra estrutural para promover sua conta a Administrador.
        </p>

        {success ? (
          <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-xl flex flex-col items-center">
            <ShieldCheck size={32} className="mb-2 text-green-600" />
            <h3 className="font-bold">Permissão Concedida!</h3>
            <p className="text-sm mt-1 text-center">Redirecionando para o painel de controle...</p>
          </div>
        ) : (
          <form onSubmit={handleUpgrade} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Chave Mestra de Segurança</label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !secret.trim()}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              Confirmar e Autenticar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
