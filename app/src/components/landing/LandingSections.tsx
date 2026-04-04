'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_NEWS } from '@/lib/constants';
import { ArrowRight, BookOpen, ExternalLink, Sparkles, HeartHandshake } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="hero-sheen relative mx-auto max-w-7xl overflow-hidden rounded-[42px] px-6 py-20 text-white shadow-[0_40px_100px_rgba(66,37,35,0.25)] sm:px-12 lg:px-20 lg:py-32">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=1920&auto=format&fit=crop"
            alt="Atmosfera de Lar"
            fill
            priority
            className="object-cover scale-105"
          />
        </div>

        <div className="relative z-10 grid gap-16 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold tracking-wide backdrop-blur-md">
              <Sparkles size={16} className="text-primary-300" />
              <span className="text-primary-50">Plataforma Nathi Faria</span>
            </div>
            
            <h1 className="mb-8 font-serif text-6xl font-bold leading-[1.1] md:text-8xl">
              É no lar onde <br/>
              <span className="text-primary-300 italic">tudo começa</span>
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-primary-100/90 md:text-2xl">
              Uma jornada de ordem, virtude e presença. Transforme a atmosfera da sua casa e a profundidade da sua vocação em uma comunidade viva.
            </p>
            
            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/cadastro"
                className="motion-button inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-base font-bold text-primary-900 shadow-2xl hover:bg-primary-50"
              >
                Começar agora <ArrowRight size={20} />
              </Link>
              <Link
                href="/trilhas"
                className="motion-button inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-10 py-5 text-base font-bold text-white backdrop-blur-sm hover:bg-white/10"
              >
                Conhecer trilhas <BookOpen size={20} />
              </Link>
            </div>
          </div>

          <div className="hidden space-y-6 lg:block">
            {[
              { label: 'Ordem', text: 'A clareza que o seu lar precisa' },
              { label: 'Educação', text: 'Guie com intencionalidade' },
              { label: 'Vocação', text: 'O seu papel único no mundo' }
            ].map((pillar, i) => (
              <div 
                key={i} 
                className="group rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary-300">{pillar.label}</p>
                <p className="mt-4 text-2xl font-serif font-bold text-white/95 group-hover:text-white">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PillarsSection() {
  const pillars = [
    {
      icon: <BookOpen size={36} />,
      title: 'Educação e Virtude',
      desc: 'Conteúdos profundos que orientam a educação dos filhos e o cultivo das virtudes no ambiente doméstico.'
    },
    {
      icon: <Sparkles size={36} />,
      title: 'Ordem e Paz',
      desc: 'Ferramentas e reflexões para organizar a rotina familiar, trazendo serenidade para o dia a dia.'
    },
    {
      icon: <HeartHandshake size={36} />,
      title: 'Comunidade Viva',
      desc: 'Um espaço de troca genuína entre mulheres que compartilham os mesmos valores e desafios.'
    }
  ];

  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary-500">Nossos Pilares</p>
          <h2 className="text-5xl font-bold text-primary-900 md:text-6xl">Uma formação para a vida inteira</h2>
          <div className="mx-auto mt-6 h-1.5 w-24 rounded-full bg-primary-200" />
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="soft-card group p-12 transition-all hover:-translate-y-2">
              <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100/50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                {pillar.icon}
              </div>
              <h3 className="text-3xl font-bold text-primary-900">{pillar.title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-primary-800/80">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[48px] border border-primary-200/30 bg-white/40 p-10 shadow-[0_30px_80px_rgba(66,37,35,0.04)] backdrop-blur-xl md:p-16">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-primary-600">Atualizações</p>
            <h2 className="text-5xl font-bold text-primary-900">Pulso Editorial</h2>
            <p className="mt-4 text-xl text-primary-800/70 italic font-serif">Acompanhe as últimas jornadas e reflexões da nossa comunidade.</p>
          </div>
          <Link 
            href="/blog" 
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary-700 transition-colors hover:text-primary-900"
          >
            Ver tudo <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {MOCK_NEWS.map((news) => (
            <article key={news.id} className="group relative overflow-hidden rounded-[36px] bg-white shadow-[0_20px_50px_rgba(66,37,35,0.06)] transition-all hover:shadow-[0_30px_70px_rgba(66,37,35,0.1)]">
              <div className="relative h-64 overflow-hidden">
                <Image src={news.imageUrl} alt={news.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute right-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-primary-900 backdrop-blur-sm">
                  {news.source === 'Instagram' ? <ExternalLink size={14} /> : <Sparkles size={14} />}
                  {news.source}
                </div>
              </div>
              <div className="p-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-500">{news.date}</p>
                <h3 className="mt-4 text-2xl font-bold leading-tight text-primary-950 group-hover:text-primary-700 transition-colors">{news.title}</h3>
                <p className="mt-4 line-clamp-3 text-base leading-relaxed text-primary-800/70">{news.summary}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold border-b border-primary-100 pb-1 w-fit group-hover:border-primary-600 transition-all">
                  Ler atualização
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="hero-sheen mx-auto max-w-6xl overflow-hidden rounded-[42px] px-8 py-20 text-center text-white shadow-[0_40px_100px_rgba(66,37,35,0.22)] md:py-28">
        <div className="relative z-10">
          <p className="mb-6 text-sm font-bold uppercase tracking-[0.4em] text-primary-300">Pronta para começar?</p>
          <h2 className="font-serif text-5xl font-bold md:text-7xl">
            Transforme a atmosfera <br/>
            do seu lar agora.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-primary-100/90">
            Junte-se a milhares de mulheres que escolheram a intencionalidade, a ordem e o cultivo das virtudes como base para suas vidas.
          </p>
          <div className="mt-14 flex flex-col justify-center gap-6 sm:flex-row">
            <Link 
              href="/cadastro" 
              className="motion-button inline-flex items-center justify-center rounded-full bg-white px-12 py-5 font-bold text-primary-900 shadow-2xl hover:bg-primary-50"
            >
              Criar minha conta
            </Link>
            <Link 
              href="/trilhas" 
              className="motion-button inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-12 py-5 font-bold text-white backdrop-blur-md hover:bg-white/20"
            >
              Explorar trilhas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
