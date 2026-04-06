import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-2xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <h1 className="mb-4 font-serif text-4xl font-bold text-stone-900">Página não encontrada</h1>
        <p className="text-stone-600">
          O caminho acessado não existe ou foi movido. Você pode voltar ao início e continuar navegando normalmente.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-primary-600 px-6 py-3 font-bold text-white transition hover:bg-primary-700"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
