import Link from 'next/link';
import { Stethoscope, Clock3, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Teleatendimento | Nathi Faria',
  description:
    'Secao de teleatendimento prevista para fase futura da plataforma.',
};

export default function TeleatendimentoPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="border border-stone-200 bg-white p-8 md:p-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center border border-primary-900/10 bg-primary-50 text-primary-700">
            <Stethoscope size={28} />
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl">Teleatendimento (Fase Futura)</h1>
          <p className="mt-4 text-lg text-stone-600">
            Esta area esta reservada para implementacao posterior, mediante nova avaliacao e eventual aditivo contratual.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-stone-800">
                <Clock3 size={18} className="text-primary-700" />
                <span className="font-semibold">Status</span>
              </div>
              <p className="text-sm text-stone-600">Planejado para ciclo posterior de evolucao da plataforma.</p>
            </div>
            <div className="border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-stone-800">
                <ShieldCheck size={18} className="text-primary-700" />
                <span className="font-semibold">Pre-requisitos</span>
              </div>
              <p className="text-sm text-stone-600">
                Definicao de fluxo clinico, compliance e requisitos adicionais de seguranca.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sobre"
              className="inline-flex items-center justify-center bg-primary-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
            >
              Voltar para Sobre
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-100"
            >
              Ver papelaria da marca
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
