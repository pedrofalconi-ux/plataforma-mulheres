'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-4 text-green-600">
            <CheckCircle size={64} />
          </div>
        </div>
        <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900">Pagamento Confirmado!</h1>
        <p className="mb-8 text-stone-600">
          Sua matrícula foi processada com sucesso. Você já pode acessar todo o conteúdo da trilha.
        </p>
        <div className="grid gap-4">
          <Link
            href="/trilhas"
            className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3 font-bold text-white transition-all hover:bg-stone-800"
          >
            Ir para meu aprendizado <ArrowRight size={18} />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
