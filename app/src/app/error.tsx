'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-stone-50">
      <div className="max-w-xl w-full rounded-3xl border border-stone-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-600 mb-3">Erro</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">Algo saiu do fluxo</h1>
        <p className="text-stone-600 mb-8">
          Encontramos um problema inesperado ao carregar esta experiÃªncia. VocÃª pode tentar novamente ou voltar para a pÃ¡gina inicial.
        </p>
        {error?.digest ? <p className="text-xs text-stone-400 mb-6">Ref.: {error.digest}</p> : null}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-700 transition"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="rounded-full border border-stone-200 px-5 py-2.5 font-bold text-stone-700 hover:bg-stone-50 transition"
          >
            Voltar ao inÃ­cio
          </Link>
        </div>
      </div>
    </div>
  );
}
