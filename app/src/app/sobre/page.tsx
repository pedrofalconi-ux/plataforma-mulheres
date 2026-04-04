import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Sobre | Dignare',
  description:
    'Conheça a visão, a linguagem e a proposta da Dignare para formação, comunidade e impacto social.',
};

const timeline = [
  {
    year: '2026',
    title: 'Nascimento da marca',
    text: 'A Dignare surge como uma nova expressão visual e conceitual para unir formação, presença comunitária e impacto social.',
  },
  {
    year: 'Fase atual',
    title: 'Plataforma em consolidação',
    text: 'A experiência evolui com jornadas, observatório, blog, perfis, eventos e ferramentas mais claras de navegação.',
  },
  {
    year: 'Próximas entregas',
    title: 'Cuidado e serviços expandidos',
    text: 'Novas experiências de acompanhamento e suporte serão incorporadas em ciclos, com foco em utilidade real.',
  },
];

const fallback = {
  hero_title: 'Dignare',
  hero_subtitle: 'Aprendizagem viva, comunidade pulsante e iniciativas com direção.',
  about_summary:
    'A plataforma conecta formação, participação comunitária e impacto social com uma linguagem mais humana, contemporânea e serena.',
  mission:
    'Cultivar jornadas de aprendizagem e participação que fortaleçam pessoas, vínculos e iniciativas concretas.',
  vision:
    'Ser uma plataforma de referência em formação comunitária com estética, clareza e profundidade.',
  values: ['Clareza', 'Cuidado', 'Comunidade', 'Responsabilidade', 'Presença'],
};

async function getInstitutionalContent() {
  try {
    const adminClient = await createAdminClient();
    const { data } = await adminClient
      .from('institutional_content')
      .select('*')
      .eq('id', true)
      .maybeSingle();

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
    <div className="px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <section className="hero-sheen mx-auto max-w-7xl overflow-hidden rounded-[36px] px-8 py-18 text-white shadow-[0_28px_90px_rgba(22,63,46,0.18)]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-100">
            quem somos
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">{content.hero_title}</h1>
          <p className="mt-6 text-lg leading-8 text-primary-100">{content.hero_subtitle}</p>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="soft-card rounded-[30px] p-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <Icon size={24} />
                </div>
                <h2 className="text-2xl font-bold text-stone-900">{item.title}</h2>
                <p className="mt-4 leading-7 text-stone-600">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="soft-card rounded-[30px] p-8">
            <h2 className="text-3xl font-bold text-stone-900">A história que estamos construindo</h2>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">{content.about_summary}</p>

            <div className="mt-8 space-y-4">
              {timeline.map((item) => (
                <div key={item.year} className="rounded-2xl bg-white/80 p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">{item.year}</div>
                  <h3 className="mt-2 text-lg font-bold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[30px] bg-[linear-gradient(160deg,#173728_0%,#224737_52%,#2d8159_100%)] p-8 text-white shadow-[0_26px_80px_rgba(22,63,46,0.18)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-200">
              <Users size={24} />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Feita para gente real</h2>
            <p className="mt-4 leading-7 text-primary-100">
              A Dignare foi desenhada para quem aprende, serve, organiza, cuida e deseja uma plataforma mais respirável e coerente.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-200">Próximo passo</p>
              <p className="mt-3 text-lg font-semibold">
                Se você quer sentir o novo fluxo da plataforma, comece pelas trilhas e pela comunidade.
              </p>
              <Link
                href="/trilhas"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-primary-900 hover:bg-stone-100"
              >
                Ir para as trilhas
                <ArrowRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
