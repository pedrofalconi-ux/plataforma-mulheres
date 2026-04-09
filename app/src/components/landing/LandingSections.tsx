'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_NEWS } from '@/lib/constants';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { EditorialButtonLink, EditorialPanel, PageSection, SectionIntro } from '@/components/brand/Editorial';
import { useAuth } from '@/hooks/useAuth';

const HERO_SLIDES = [
  {
    src: '/hero/hero-1.jpeg',
    alt: 'Criancas assistindo a uma atividade em familia',
    label: 'Rotinas que aproximam a familia',
  },
  {
    src: '/hero/hero-2.jpeg',
    alt: 'Família reunida em um momento de celebração',
    label: 'Memorias construidas com presenca',
  },
  {
    src: '/hero/hero-3.jpeg',
    alt: 'Mulher em um ambiente de acolhimento e celebração',
    label: 'Feminilidade, casa e intencao',
  },
];

export function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <PageSection className="pt-10">
      <div className="hero-sheen border border-primary-900/8 px-8 py-10 text-white sm:px-10 lg:px-16 lg:py-14">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="editorial-kicker !text-white/78">Plataforma Nathi Faria</p>
            <h1 className="mt-5 max-w-2xl font-serif text-[4rem] leading-[1.05] text-white sm:text-[5.2rem]">
              Transformando a sua casa num lar.
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-9 text-white/86">
              A casa se torna um lar quando nela as pessoas usam o tempo para formar vínculos.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <EditorialButtonLink href="/trilhas" className="!min-w-[260px]">
                Acessar meu aprendizado <ArrowRight size={18} />
              </EditorialButtonLink>
            </div>
          </div>

          <div className="relative lg:ml-auto lg:w-full lg:max-w-[580px]">
            <div className="relative min-h-[480px] overflow-hidden border-4 border-white/70 bg-white/15 md:min-h-[540px]">
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={slide.src}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === activeSlide ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 border-t border-white/18 bg-black/35 px-5 py-4 backdrop-blur-sm">
                <div className="text-sm text-white/92">
                  <span>{HERO_SLIDES[activeSlide]?.label}</span>
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
  const whatsappGroupUrl = 'https://chat.whatsapp.com/CqfMMJLcdz06bMAAZ7KeS3?mode=gi_t';
  const pillars = [
    {
      icon: <BookOpen size={32} />,
      title: 'Aprendizado',
      desc: 'O planejamento da sua casa deve ter propósito intencional, e isso também pode ser aprendido.',
    },
    {
      icon: <Sparkles size={32} />,
      title: 'Presença',
      desc: 'O modo como você vive na sua casa revela o que é verdadeiramente importante para você.',
    },
    {
      icon: <HeartHandshake size={32} />,
      title: 'Comunidade',
      desc: 'Lugar onde criamos vínculos e nos dedicamos ao desenvolvimento mútuo de relacionamentos saudáveis.',
    },
  ];

  return (
    <PageSection className="py-24">
      <SectionIntro
        eyebrow="Um aprendizado que transforma"
        title="Lar onde o coração se forma."
        description="Cada trilha foi pensada para fortalecer atitudes e práticas que você exerce dentro do seu lar."
        align="center"
      />

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <EditorialPanel key={pillar.title} className="flex min-h-[320px] flex-col items-center p-10 text-center">
            <div className="mb-10 flex h-16 w-16 items-center justify-center border border-primary-900/12 bg-primary-50 text-primary-800">
              {pillar.icon}
            </div>
            <h3 className="text-3xl text-primary-900">{pillar.title}</h3>
            <p className="mt-5 text-base leading-8 text-primary-900/72">{pillar.desc}</p>
          </EditorialPanel>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href={whatsappGroupUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-w-[280px] items-center justify-center border border-primary-900 bg-primary-900 px-6 py-4 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-white transition hover:bg-primary-800"
        >
          Entrar no grupo do WhatsApp
        </a>
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
            title="Textos, reflexões e materiais para sustentar a sua jornada."
            description="Um espaço editorial para quem deseja estudar com profundidade e aplicar com delicadeza."
            className="max-w-3xl"
          />
          <EditorialButtonLink href="/blog" variant="secondary" className="border-white/40 !text-white">
            Ver todos os conteúdos
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
                  Ler atualização
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
  const { isAuthenticated, loading } = useAuth();

  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-primary-900 py-24 text-white">
      <PageSection>
        <div className="mx-auto flex max-w-5xl flex-col items-center border border-white/12 bg-white/[0.04] px-8 py-16 text-center lg:px-20">
          <p className="editorial-kicker !text-white/72">Acesso exclusivo para alunas</p>
          <h2 className="mt-6 text-5xl leading-tight text-white sm:text-6xl">
            Com sabedoria se constrói a casa, e com entendimento ela se estabelece.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-9 text-white/78">
            O acesso à plataforma é reservado para quem já possui conta criada e aprovada no ambiente de aprendizagem.
          </p>

          <div className="mt-12">
            <Link
              href="/login"
              className="inline-flex min-w-[260px] items-center justify-center border border-white bg-white px-6 py-4 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-primary-900 transition hover:border-stone-100 hover:bg-stone-100"
            >
              Entrar com minha conta
            </Link>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
