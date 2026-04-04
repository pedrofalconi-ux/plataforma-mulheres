'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_NEWS, BRAND_NAME } from '@/lib/constants';
import { ArrowRight, Map, HeartHandshake, BookOpen, ExternalLink, Sparkles, Leaf, Orbit } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="hero-sheen motion-float relative mx-auto max-w-7xl overflow-hidden rounded-[36px] px-6 py-16 text-white shadow-[0_30px_90px_rgba(22,63,46,0.22)] sm:px-10 lg:px-14 lg:py-24">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="https://picsum.photos/1920/1080?blur=2"
            alt="Atmosfera orgânica"
            fill
            priority
            className="object-cover mix-blend-soft-light"
          />
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Leaf size={16} />
              nova identidade visual
            </div>
            <div className="relative mb-8 h-28 w-80 md:h-40 md:w-[480px]">
              <Image
                src="/logo.png.png"
                alt={BRAND_NAME}
                fill
                className="object-contain object-left"
                priority
              />
              <h1 className="sr-only">{BRAND_NAME}</h1>
            </div>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-100 md:text-xl">
              Uma plataforma mais serena, elegante e humana para aprender com profundidade, participar em comunidade e transformar realidades com consistência.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary-900 shadow-lg hover:bg-primary-50"
              >
                Entrar na Dignare <ArrowRight size={18} />
              </Link>
              <Link
                href="/trilhas"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
              >
                Ver jornadas <Orbit size={18} />
              </Link>
            </div>
          </div>

          <div className="motion-list grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-200">Formação</p>
              <p className="mt-3 text-2xl font-serif font-bold">Trilhas que respeitam o ritmo humano</p>
            </div>
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-200">Comunidade</p>
              <p className="mt-3 text-2xl font-serif font-bold">Uma rede ativa de troca, apoio e continuidade</p>
            </div>
            <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-200">Impacto</p>
              <p className="mt-3 text-2xl font-serif font-bold">Projetos e iniciativas conectados a ação real</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PillarsSection() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-primary-600">Direção criativa</p>
          <h2 className="text-4xl font-bold text-primary-900">Uma linguagem visual mais viva e respirável</h2>
        </div>

        <div className="motion-list grid gap-6 md:grid-cols-3">
          <div className="soft-card motion-card rounded-[30px] p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <BookOpen size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900">Aprendizado com presença</h3>
            <p className="mt-3 leading-7 text-stone-600">
              Trilhas desenhadas para conduzir o usuário com mais clareza, menos ruído visual e sensação de progresso contínuo.
            </p>
          </div>

          <div className="soft-card motion-card rounded-[30px] p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <Map size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900">Território e observação</h3>
            <p className="mt-3 leading-7 text-stone-600">
              A paleta verde aproxima a plataforma de um senso de ecossistema, cuidado e vínculo com iniciativas concretas.
            </p>
          </div>

          <div className="soft-card motion-card rounded-[30px] p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
              <HeartHandshake size={28} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900">Comunidade que acolhe</h3>
            <p className="mt-3 leading-7 text-stone-600">
              Menos aparência institucional rígida, mais sensação de casa, círculo e continuidade para quem participa com frequência.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsSection() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="motion-float mx-auto max-w-7xl rounded-[34px] border border-primary-900/8 bg-white/70 p-8 shadow-[0_18px_55px_rgba(21,32,25,0.06)] backdrop-blur md:p-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-primary-600">Atualizações</p>
            <h2 className="text-4xl font-bold text-stone-900">Conteúdo com pulso editorial</h2>
            <p className="mt-2 text-stone-600">Uma vitrine mais limpa para notícias, movimentos da comunidade e novos aprendizados.</p>
          </div>
          <Link href="/blog" className="text-sm font-bold text-primary-700 hover:text-primary-900">Ver tudo</Link>
        </div>

        <div className="motion-list grid gap-6 md:grid-cols-3">
          {MOCK_NEWS.map((news) => (
            <article key={news.id} className="motion-card overflow-hidden rounded-[28px] border border-primary-900/8 bg-white shadow-[0_18px_45px_rgba(21,32,25,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(21,32,25,0.08)]">
              <div className="relative h-52 overflow-hidden">
                <Image src={news.imageUrl} alt={news.title} fill className="object-cover" />
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary-900/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {news.source === 'Instagram' ? <ExternalLink size={12} /> : <Sparkles size={12} />}
                  {news.source}
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">{news.date}</p>
                <h3 className="mt-3 text-2xl font-bold leading-tight text-stone-900">{news.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{news.summary}</p>
                <div className="mt-5 text-sm font-bold text-primary-700">Ler atualização</div>
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
    <section className="px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="motion-float mx-auto max-w-5xl rounded-[36px] bg-[linear-gradient(135deg,#173728_0%,#244c39_45%,#2f9464_100%)] px-8 py-14 text-center text-white shadow-[0_30px_90px_rgba(22,63,46,0.22)]">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-primary-200">Nova fase</p>
        <h2 className="text-4xl font-bold md:text-5xl">Dignare está ficando mais clara, calma e desejável de usar.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-primary-100">
          Entre para uma plataforma com trilhas mais organizadas, navegação mais suave e uma identidade que comunica presença, confiança e cuidado.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/cadastro" className="rounded-full bg-white px-7 py-3.5 font-bold text-primary-900 hover:bg-primary-50">
            Criar conta
          </Link>
          <Link href="/trilhas" className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 font-bold text-white hover:bg-white/15">
            Explorar jornadas
          </Link>
        </div>
      </div>
    </section>
  );
}
