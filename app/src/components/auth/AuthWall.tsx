'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function AuthWall() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <Lock className="text-stone-300 mb-4" size={64} />
      <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Conteúdo Restrito</h2>
      <p className="text-stone-600 mb-6 max-w-md">
        Esta área é exclusiva para membros da comunidade. Faça login ou cadastre-se para acessar trilhas, fóruns e lives.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700">
          Login
        </Link>
        <Link href="/cadastro" className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg font-bold hover:bg-stone-50">
          Cadastro
        </Link>
      </div>
    </div>
  );
}
