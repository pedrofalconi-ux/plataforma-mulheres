'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-primary-500">Algo saiu do esperado</p>
        <h1 className="mb-4 font-serif text-4xl font-bold text-stone-900">Não foi possível carregar esta página</h1>
        <p className="text-stone-600">
          Encontramos um problema inesperado ao carregar esta experiência. Você pode tentar novamente ou voltar para a página inicial.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-primary-600 px-6 py-3 font-bold text-white transition hover:bg-primary-700"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-xl border border-stone-200 px-6 py-3 font-bold text-stone-700 transition hover:bg-stone-50"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
