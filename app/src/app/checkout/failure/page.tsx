'use client';

import React from 'react';
import Link from 'next/link';
import { XCircle, RefreshCw } from 'lucide-react';

export default function CheckoutFailurePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4 text-red-600">
            <XCircle size={64} />
          </div>
        </div>
        <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900">Ops! Algo deu errado.</h1>
        <p className="mb-8 text-stone-600">
          Não foi possível processar seu pagamento. Verifique seus dados ou tente outro método.
        </p>
        <div className="grid gap-4">
          <Link
            href="/checkout"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-bold text-white transition-all hover:bg-primary-700 shadow-md"
          >
            Tentar Novamente <RefreshCw size={18} />
          </Link>
          <Link
            href="/sobre"
            className="text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            Precisa de ajuda? Fale conosco
          </Link>
        </div>
      </div>
    </div>
  );
}
