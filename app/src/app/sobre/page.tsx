import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Sobre | Nathi Faria',
  description: 'Conheça a visão, a linguagem e a proposta da plataforma Nathi Faria.',
};

const timeline = [
  {
    year: '2026',
    title: 'Refinamento da marca',
    text: 'A plataforma assume uma linguagem mais conectada ao valor espiritual, afetivo e formativo do lar.',
  },
  {
    year: 'Fase atual',
    title: 'Plataforma em consolidação',
    text: 'A casa se torna um lar quando nela as pessoas usam o tempo para formar vínculos.',
  },
  {
    year: 'Próximas entregas',
    title: 'Cuidado e serviços expandidos',
    text: 'Novas experiências de acompanhamento e suporte serão incorporadas em ciclos, com foco em utilidade real.',
  },
];

const fallback = {
  hero_title: 'Nathi Faria',
  hero_subtitle: 'Transformando a sua casa num lar.',
  about_summary: 'O ambiente familiar da residência define o destino daqueles que ali moram.',
  mission: 'Fortalecer atitudes e práticas que transformam a casa em um lar onde o coração se forma.',
  vision: 'Ver mulheres construindo lares com sabedoria, entendimento e vínculos saudáveis.',
  values: ['Sabedoria', 'Entendimento', 'Vínculos', 'Cuidado', 'Propósito'],
};

const ABOUT_DRIVE_PREVIEW_URL = 'https://drive.google.com/file/d/1LyDPdnXepA6Hyed0pAfFToj8XwXv_agh/preview';

async function getInstitutionalContent() {
  try {
    const adminClient = await createAdminClient();
    const { data } = await adminClient.from('institutional_content').select('*').eq('id', true).maybeSingle();

    if (!data) return fallback;

    return {
      hero_title: data.hero_title || fallback.hero_title,
      hero_subtitle: data.hero_subtitle || fallback.hero_subtitle,
      about_summary: data.about_summary || fallback.about_summary,
      mission: data.mission || fallback.mission,
      vision: data.vision || fallback.vision,
      values: Array.isArray(data.values) && data.values.length > 0 ? data.values : fallback.values,
    };
  } catch {
    return fallback;
  }
}

export default async function SobrePage() {
  const content = await getInstitutionalContent();

  const pillars = [
    { title: 'Missão', text: content.mission, icon: HeartHandshake },
    { title: 'Visão', text: content.vision, icon: Sparkles },
    { title: 'Valores', text: content.values.join(', '), icon: ShieldCheck },
  ];

  return (
    <div className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl border border-primary-900/10 bg-white px-8 py-12">
        <div className="overflow-hidden border border-primary-900/10 bg-stone-100 shadow-sm">
          <div className="mb-6">
            <span className="editorial-kicker">É no lar onde tudo começa</span>
          </div>
          <div className="aspect-video w-full bg-black">
            <iframe
              src={ABOUT_DRIVE_PREVIEW_URL}
              title="Manifesto - É no lar onde tudo começa"
              allow="autoplay; fullscreen"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border border-primary-900/10 bg-white p-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-primary-900/10 bg-primary-50 text-primary-700">
                  <Icon size={24} />
                </div>
                <h2 className="text-3xl leading-none text-primary-900">{item.title}</h2>
                <p className="mt-4 leading-8 text-primary-900/72">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-primary-900/10 bg-white p-8">
            <h2 className="text-4xl leading-none text-primary-900">A história que estamos construindo</h2>
            <p className="mt-4 max-w-2xl leading-8 text-primary-900/72">{content.about_summary}</p>

            <div className="mt-8 space-y-4">
              {timeline.map((item) => (
                <div key={item.year} className="border border-primary-900/10 bg-primary-50/40 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">{item.year}</div>
                  <h3 className="mt-2 text-2xl leading-none text-primary-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-primary-900/72">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-primary-900/10 bg-primary-900 p-8 text-white">
            <div className="flex h-12 w-12 items-center justify-center border border-white/16 bg-white/5 text-primary-200">
              <Users size={24} />
            </div>
            <h2 className="mt-6 text-4xl leading-none">Feita para gente real</h2>
            <p className="mt-4 leading-8 text-white/76">
              Até mesmo uma tenda pode se tornar um lar quando as pessoas que ali vivem se dedicam ao desenvolvimento
              mútuo de relacionamentos saudáveis.
            </p>
            <div className="mt-8 border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-200">Próximo passo</p>
              <p className="mt-3 text-lg font-semibold">
                Você é o conjunto das suas atitudes e práticas que exerce dentro do seu lar.
              </p>
              <Link
                href="/trilhas"
                className="mt-6 inline-flex items-center gap-2 border border-white/20 bg-white px-5 py-3 font-bold text-primary-900 hover:bg-stone-100"
              >
                Ir para aprendizado
                <ArrowRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
