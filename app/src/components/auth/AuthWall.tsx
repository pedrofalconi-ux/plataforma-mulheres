'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function AuthWall() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Lock className="mb-4 text-stone-300" size={64} />
      <h2 className="mb-2 text-2xl font-serif font-bold text-stone-800">Conteúdo Restrito</h2>
      <p className="mb-6 max-w-md text-stone-600">
        Esta área é exclusiva para membros da comunidade. Faça login com uma conta já existente para acessar trilhas, fóruns e lives.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded-lg bg-primary-600 px-6 py-2 font-bold text-white hover:bg-primary-700">
          Entrar
        </Link>
      </div>
    </div>
  );
}
