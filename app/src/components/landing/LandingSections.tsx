'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_NEWS } from '@/lib/constants';
import { ArrowRight, BookOpen, ExternalLink, HeartHandshake, Sparkles } from 'lucide-react';
import { EditorialButtonLink, EditorialPanel, PageSection, SectionIntro } from '@/components/brand/Editorial';

export function HeroSection() {
  return (
    <PageSection className="pt-10">
      <div className="hero-sheen border border-primary-900/8 px-8 py-10 text-white sm:px-10 lg:px-16 lg:py-14">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <p className="editorial-kicker !text-white/78">Plataforma Nathi Faria</p>
            <h1 className="mt-5 max-w-xl font-serif text-[4rem] leading-[0.92] text-white sm:text-[5.6rem]">
              Transforme seu lar. Inspire sua familia. Viva com proposito.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-9 text-white/86">
              Uma comunidade feita para mulheres que desejam viver com mais amor, equilibrio e proposito dentro do seu lar.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <EditorialButtonLink href="/cadastro" className="!min-w-[260px]">
                Comece sua transformacao <ArrowRight size={18} />
              </EditorialButtonLink>
              <EditorialButtonLink href="/trilhas" variant="secondary" className="!min-w-[220px] border-white/55 !text-white">
                Ver aulas e materiais
              </EditorialButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="relative min-h-[520px] overflow-hidden border-4 border-white/70 bg-white/15">
              <Image
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"
                alt="Retrato editorial feminino"
                fill
                priority
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/18 bg-black/35 px-5 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm text-white/92">
                  <span>Manifesto de casa, ordem e presenca</span>
                  <span>01:12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
}

export function PillarsSection() {
  const pillars = [
    {
      icon: <BookOpen size={32} />,
      title: 'Aprendizado',
      desc: 'Trilhas para orientar o cotidiano com mais ordem, clareza e delicadeza.',
    },
    {
      icon: <Sparkles size={32} />,
      title: 'Presenca',
      desc: 'Uma linguagem mais serena para sustentar rotina, identidade e vocacao.',
    },
    {
      icon: <HeartHandshake size={32} />,
      title: 'Comunidade',
      desc: 'Troca entre mulheres que compartilham desafios, valores e referencias em comum.',
    },
  ];

  return (
    <PageSection className="py-24">
        <SectionIntro
          eyebrow="Um aprendizado que transforma"
          title="Aprendizado, presenca e clareza para o lar e o coracao."
          description="Cada trilha foi pensada para reunir aulas, materiais em PDF e uma sequencia clara para sustentar uma transformacao real."
          align="center"
        />

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <EditorialPanel key={pillar.title} className="min-h-[280px] p-10">
            <div className="mb-10 flex h-14 w-14 items-center justify-center border border-primary-900/12 bg-primary-50 text-primary-800">
              {pillar.icon}
            </div>
            <h3 className="text-3xl text-primary-900">{pillar.title}</h3>
            <p className="mt-5 text-base leading-8 text-primary-900/72">{pillar.desc}</p>
          </EditorialPanel>
        ))}
      </div>
    </PageSection>
  );
}

export function NewsSection() {
  return (
    <div className="bg-primary-900 py-24 text-white">
      <PageSection>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionIntro
            eyebrow="Papelaria"
            title="Textos, reflexoes e materiais para sustentar a sua jornada."
            description="Um espaco editorial para quem deseja estudar com profundidade e aplicar com delicadeza."
            className="max-w-3xl"
          />
          <EditorialButtonLink href="/blog" variant="secondary" className="border-white/40 !text-white">
            Ver todos os conteudos
          </EditorialButtonLink>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {MOCK_NEWS.map((news) => (
            <article key={news.id} className="border border-white/14 bg-white/[0.03]">
              <div className="relative h-72 overflow-hidden">
                <Image src={news.imageUrl} alt={news.title} fill unoptimized className="object-cover" />
                <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 border border-white/18 bg-black/35 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                  {news.source === 'Instagram' ? <ExternalLink size={14} /> : <Sparkles size={14} />}
                  {news.source}
                </div>
              </div>
              <div className="border-t border-white/10 p-8">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/55">{news.date}</p>
                <h3 className="mt-4 text-3xl leading-none text-white">{news.title}</h3>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/72">{news.summary}</p>
                <div className="mt-8 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.24em] text-white">
                  Ler atualizacao
                </div>
              </div>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}

export function CtaSection() {
  return (
    <PageSection className="py-24">
      <div className="grid gap-8 border border-primary-900/10 bg-white px-8 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <div>
          <p className="editorial-kicker">Pronta para comecar?</p>
          <h2 className="mt-4 text-5xl leading-none text-primary-900 sm:text-6xl">
            Um novo ritmo para a casa, para a familia e para a sua presenca.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-9 text-primary-900/72">
            Entre na plataforma e encontre trilhas organizadas, materiais de apoio e uma experiencia mais serena, madura e intencional.
          </p>
        </div>

        <div className="flex flex-col justify-end gap-4">
          <EditorialButtonLink href="/cadastro">
            Criar minha conta
          </EditorialButtonLink>
          <EditorialButtonLink href="/trilhas" variant="secondary" className="border-primary-900/20 !text-primary-900">
            Explorar aprendizado
          </EditorialButtonLink>
          <Link href="/sobre" className="text-sm font-extrabold uppercase tracking-[0.24em] text-primary-900/68">
            Conhecer a visao da marca
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
