'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-primary-950 px-4 text-white">
          <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary-300">Falha crítica</p>
            <h1 className="mb-3 font-serif text-3xl font-bold">Não foi possível continuar</h1>
            <p className="text-white/75">
              Ocorreu um erro global na aplicação. Tente recarregar a experiência.
            </p>
            <button
              onClick={() => reset()}
              className="mt-8 rounded-xl bg-white px-6 py-3 font-bold text-primary-950 transition hover:bg-stone-100"
            >
              Recarregar aplicação
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
