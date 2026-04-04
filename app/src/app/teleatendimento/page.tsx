import Link from 'next/link';
import { Stethoscope, Clock3, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Teleatendimento | Ecossistema da Dignidade',
  description:
    'Seção de teleatendimento prevista para fase futura do Ecossistema da Dignidade, conforme planejamento contratual.',
};

export default function TeleatendimentoPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-stone-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <Stethoscope size={28} />
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl">Teleatendimento (Fase Futura)</h1>
          <p className="mt-4 text-lg text-stone-600">
            Esta área está reservada para implementação posterior, mediante nova avaliação e eventual aditivo
            contratual, conforme previsto no contrato do projeto.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-stone-800">
                <Clock3 size={18} className="text-primary-700" />
                <span className="font-semibold">Status</span>
              </div>
              <p className="text-sm text-stone-600">Planejado para ciclo posterior de evolução da plataforma.</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-stone-800">
                <ShieldCheck size={18} className="text-primary-700" />
                <span className="font-semibold">Pré-requisitos</span>
              </div>
              <p className="text-sm text-stone-600">
                Definição de fluxo clínico, compliance e requisitos adicionais de segurança.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sobre"
              className="inline-flex items-center justify-center rounded-xl bg-primary-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-800"
            >
              Voltar para Sobre
            </Link>
            <Link
              href="/eventos"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-100"
            >
              Ver agenda da comunidade <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
