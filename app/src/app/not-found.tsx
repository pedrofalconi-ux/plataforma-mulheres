import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl rounded-3xl border border-stone-200 bg-white p-10 shadow-sm text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600 mb-3">404</p>
        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">PÃ¡gina nÃ£o encontrada</h1>
        <p className="text-stone-600 mb-8">
          O caminho acessado nÃ£o existe ou foi movido. VocÃª pode voltar ao inÃ­cio e continuar navegando normalmente.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-primary-600 px-5 py-2.5 font-bold text-white hover:bg-primary-700 transition"
        >
          Ir para a home
        </Link>
      </div>
    </div>
  );
}
