'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-stone-950 text-white">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-300 mb-3">Falha CrÃ­tica</p>
            <h1 className="text-3xl font-serif font-bold mb-3">NÃ£o foi possÃ­vel continuar</h1>
            <p className="text-stone-300 mb-8">
              Ocorreu um erro global na aplicaÃ§Ã£o. Tente recarregar a experiÃªncia.
            </p>
            {error?.digest ? <p className="text-xs text-stone-400 mb-6">Ref.: {error.digest}</p> : null}
            <button
              onClick={reset}
              className="rounded-full bg-white px-5 py-2.5 font-bold text-stone-950 hover:bg-stone-200 transition"
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
