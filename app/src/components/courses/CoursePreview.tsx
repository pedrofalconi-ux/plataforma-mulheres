'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle2, Lock, ShieldCheck, Clock, BookOpen, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Course, Module, Lesson } from '@/lib/schemas';

type CoursePreviewData = Course & {
  categories: { name: string; slug: string } | null;
  modules: Array<Module & { lessons: Array<Lesson> }>;
};

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';

export function CoursePreview({ course }: { course: CoursePreviewData }) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const toggleModule = (id: string) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalLessons = course.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.duration_minutes || 0), 0) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={course.thumbnail_url || FALLBACK_THUMBNAIL} 
            alt={course.title} 
            className="h-full w-full object-cover opacity-20 grayscale transition-transform duration-1000 animate-in fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary-600/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-400 border border-primary-500/30">
                {course.level}
              </span>
              {course.categories && (
                <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-stone-300">
                  {course.categories.name}
                </span>
              )}
            </div>
            
            <h1 className="mb-6 font-serif text-4xl font-bold leading-tight lg:text-6xl text-white">
              {course.title}
            </h1>
            
            <p className="mb-8 text-lg text-stone-300 leading-relaxed max-w-2xl">
              {course.description || "Aprofunde seus conhecimentos nesta trilha formativa completa, pensada para construir bases sólidas no seu desenvolvimento."}
            </p>

            <div className="flex flex-wrap gap-6 text-sm font-medium text-stone-400">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary-500" />
                <span>{course.modules.length} Módulos ({totalLessons} Aulas)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                <span>
                  {totalDuration < 60 
                    ? `${totalDuration} min` 
                    : `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? ` ${totalDuration % 60}min` : ''}`} de carga
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                <span>Carga Horária: ~{Math.round(totalDuration / 60)}h</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-primary-500" />
                <span>Certificado Incluso</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3 lg:items-start">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* O Que Você Vai Aprender */}
            <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
                Por que percorrer esta trilha?
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Acesso imediato a todas as aulas de base.",
                  "Metodologia prática com materiais complementares.",
                  "Acompanhamento e fórum tira-dúvidas dedicado.",
                  "Garantia de acesso vitalício para alunas matriculadas."
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 text-primary-600 shrink-0" size={20} />
                    <span className="text-stone-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum Menu */}
            <section>
              <div className="mb-6 flex items-end justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">Conteúdo Programático</h2>
                  <p className="mt-1 text-sm text-stone-500">Cronograma completo da jornada.</p>
                </div>
              </div>

              <div className="space-y-4">
                {course.modules.length === 0 ? (
                  <p className="text-stone-500 text-center py-10">Módulos em estruturação...</p>
                ) : (
                  course.modules.map((module, index) => {
                    const isOpen = openModules[module.id];
                    const moduleLessons = module.lessons || [];
                    
                    return (
                      <div key={module.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-primary-200">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="flex w-full items-center justify-between bg-white p-5 text-left transition-colors hover:bg-stone-50 focus:outline-none"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-bold text-stone-500">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-stone-900">{module.title}</h3>
                              <p className="text-xs text-stone-500 mt-1">{moduleLessons.length} aulas</p>
                            </div>
                          </div>
                          <ChevronDown className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>
                        
                        {isOpen && (
                          <div className="border-t border-stone-100 bg-stone-50 px-5 py-2">
                            {moduleLessons.length === 0 ? (
                              <p className="py-4 text-sm text-stone-500 text-center">Nenhuma aula gravada neste módulo ainda.</p>
                            ) : (
                              <div className="flex flex-col gap-1 py-3">
                                {moduleLessons.map((lesson, idx) => (
                                  <div key={lesson.id} className={`group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${lesson.is_coming_soon ? 'bg-stone-200/80' : 'hover:bg-stone-200/50'}`}>
                                    <div className="flex items-center gap-3">
                                      {lesson.is_coming_soon ? (
                                        <Lock size={18} className="text-stone-400" />
                                      ) : lesson.type === 'video' ? (
                                        <PlayCircle size={18} className="text-primary-500 opacity-70" />
                                      ) : (
                                        <FileText size={18} className="text-blue-500 opacity-70" />
                                      )}
                                      <span className={`text-sm font-medium ${lesson.is_coming_soon ? 'text-stone-500' : 'text-stone-700'}`}>
                                        <span className="mr-2 text-stone-400 font-normal">{idx + 1}.</span> 
                                        {lesson.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      {lesson.is_coming_soon ? (
                                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Em breve</span>
                                      ) : lesson.duration_minutes > 0 ? (
                                        <span className="text-xs text-stone-400">{lesson.duration_minutes} min</span>
                                      ) : null}
                                      <Lock size={14} className="text-stone-300 group-hover:text-stone-400 transition-colors" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/50">
              <div className="mb-6 border-b border-stone-100 pb-6 text-center">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-600 mb-2">Acesso Restrito</p>
                <h2 className="text-3xl font-black text-stone-900 mb-1">
                  Trilha Exclusiva
                </h2>
                <p className="text-sm text-stone-500">Conteúdo disponível para alunas</p>
              </div>

              <div className="space-y-4 mb-8">
                <Link
                  href="/cadastro"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-[#DBA1A2] hover:shadow-lg hover:-translate-y-0.5"
                >
                  Entrar na Plataforma
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="text-center text-[10px] text-stone-400 leading-tight">
                  Se você já adquiriu através do checkout oficial, faça login para acessar.
                </p>
              </div>

              <div className="space-y-3 rounded-xl bg-stone-50 p-4 border border-stone-100">
                <div className="flex items-center gap-3 text-sm text-stone-700">
                  <ShieldCheck size={18} className="text-green-600" />
                  <span>Ambiente de aprendizado seguro.</span>
                </div>
              </div>
            </div>
            
            {/* Instructor snippet */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 flex items-center gap-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#Vanilla Ice] border border-[#DBA1A2]/20 text-[#DBA1A2] shrink-0 font-bold">
                  NF
               </div>
               <div>
                 <p className="text-xs text-stone-500 font-medium">Oferecido por</p>
                 <p className="font-bold text-stone-900 uppercase tracking-tighter">Nathi Faria</p>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
