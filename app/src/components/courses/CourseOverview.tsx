'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Lock,
  Loader2,
  MessageSquareQuote,
  PlayCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';
const DEFAULT_BENEFITS = [
  'Módulos e aulas organizados em uma sequência clara.',
  'Materiais complementares em PDF e arquivos de apoio.',
  'Acesso direto ao conteúdo publicado para todas as alunas.',
  'Espaço flexível para aprofundar a formação da plataforma.',
];

function formatDuration(mins: number) {
  if (mins === 0) return 'Ritmo livre';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isLessonComingSoon(lesson: any) {
  return Boolean(lesson?.is_coming_soon);
}

export default function CourseOverview({ courseId }: { courseId: string }) {
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadCourseDetails() {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase
            .from('modules')
            .select(`
              id, title, order_index, description,
              lessons (
                id, title, description, type, duration_minutes, is_coming_soon, coming_soon_image_url, order_index
              )
            `)
            .eq('course_id', courseId)
            .order('order_index', { ascending: true }),
        ]);

        if (courseRes.data) {
          let parsedBenefits = DEFAULT_BENEFITS;
          if (courseRes.data.benefits) {
            try {
              parsedBenefits =
                typeof courseRes.data.benefits === 'string'
                  ? JSON.parse(courseRes.data.benefits)
                  : courseRes.data.benefits;
            } catch {
              parsedBenefits = DEFAULT_BENEFITS;
            }
          }
          setCourse({ ...courseRes.data, parsedBenefits });
        }

        const orderedModules = (modulesRes.data || []).map((module: any) => ({
          ...module,
          lessons: (module.lessons || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
        }));

        setModules(orderedModules);

        if (orderedModules.length > 0) {
          setOpenModules({ [orderedModules[0].id]: true });
        }
      } catch (err) {
        console.error('Error loading course overview:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadCourseDetails();
  }, [courseId, supabase]);

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F2ED]">
        <Loader2 className="animate-spin text-[#DBA1A2]" size={48} />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center text-stone-500">Bloco não encontrado.</div>;
  }

  const totalLessons = modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);
  const totalDuration = modules.reduce(
    (acc, module) =>
      acc +
      (module.lessons?.reduce(
        (lessonAcc: number, lesson: any) => lessonAcc + (lesson.duration_minutes || 0),
        0,
      ) || 0),
    0,
  );

  const includesTestimonials = /testemunh/i.test(`${course.title} ${course.description}`);

  return (
    <div className="min-h-screen bg-[#F7F2ED] pb-20">
      <div className="relative overflow-hidden bg-[#422523] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={course.thumbnail_url || FALLBACK_THUMBNAIL}
            alt={course.title}
            className="h-full w-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#422523] via-[#422523]/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#DBA1A2]/30 bg-[#DBA1A2]/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#DBA1A2]">
                {includesTestimonials ? 'Testemunhos' : 'Aprendizado'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium text-stone-300">
                Acesso liberado para todas as alunas
              </span>
            </div>

            <h1 className="mb-4 font-serif text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:mb-8 lg:text-7xl">
              {course.title}
            </h1>

            <p className="mb-10 max-w-2xl text-xl font-light leading-relaxed text-stone-300">
              {course.description || 'Este bloco foi preparado para concentrar aulas, módulos e materiais da experiência da plataforma.'}
            </p>

            <div className="flex flex-wrap gap-8 text-sm font-bold uppercase tracking-widest text-stone-300">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-[#DBA1A2]" />
                <span>{modules.length} módulos</span>
              </div>
              <div className="flex items-center gap-3">
                <PlayCircle size={20} className="text-[#DBA1A2]" />
                <span>{totalLessons} aulas</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[#DBA1A2]" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3 lg:items-start">
          <div className="space-y-16 lg:col-span-2">
            <section className="rounded-[40px] border border-[#E7D8D8] bg-white p-10 shadow-[0_20px_60px_rgba(66,37,35,0.03)] sm:p-14">
              <h2 className="mb-10 border-b border-[#F7F2ED] pb-6 font-serif text-3xl font-medium text-[#422523]">
                O que este bloco entrega
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {course.parsedBenefits?.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7F2ED]">
                      <CheckCircle2 className="text-[#DBA1A2]" size={14} />
                    </div>
                    <span className="text-base font-light leading-relaxed text-[#422523]">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-10 flex items-end justify-between border-b border-[#E7D8D8] pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-medium text-[#422523]">Módulos e aulas</h2>
                  <p className="mt-2 text-sm font-bold uppercase tracking-widest text-[#422523]/40">
                    {modules.length} módulos • {totalLessons} aulas • {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {modules.length === 0 ? (
                  <p className="py-10 text-center font-serif text-stone-500">Este bloco está sendo preparado para você.</p>
                ) : (
                  modules.map((module, index) => {
                    const isOpen = openModules[module.id];
                    const moduleLessons = module.lessons || [];

                    return (
                      <div
                        key={module.id}
                        className="overflow-hidden rounded-[32px] border border-[#E7D8D8] bg-white shadow-sm transition-all hover:shadow-md"
                      >
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#F7F2ED]/30 focus:outline-none sm:p-8"
                        >
                          <div className="flex items-center gap-6">
                            <span className="w-8 text-center text-xl font-black text-[#DBA1A2] opacity-40">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-serif text-xl font-medium text-[#422523] sm:text-2xl">
                                {module.title}
                              </h3>
                              {module.description ? (
                                <p className="mt-2 text-sm leading-7 text-[#422523]/55">{module.description}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-[#422523]/40 sm:block">
                              {moduleLessons.length} aulas
                            </span>
                            <ChevronDown
                              className={`text-[#DBA1A2] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                              size={24}
                            />
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="bg-white px-8 pb-8 pt-2">
                            {moduleLessons.length === 0 ? (
                              <p className="py-4 text-center text-sm font-light text-stone-500">
                                Nenhuma aula disponível neste módulo.
                              </p>
                            ) : (
                              <div className="space-y-2 border-t border-[#F7F2ED] pt-6">
                                {moduleLessons.map((lesson: any, lessonIndex: number) => (
                                  <div
                                    key={lesson.id}
                                    className={`overflow-hidden rounded-2xl transition-all ${isLessonComingSoon(lesson) ? 'border border-stone-200 bg-stone-100 text-stone-500' : 'p-4 hover:bg-[#F7F2ED]/50'}`}
                                  >
                                    {isLessonComingSoon(lesson) ? (
                                      <div className="flex flex-col sm:flex-row">
                                        <div className="relative h-32 w-full shrink-0 overflow-hidden bg-stone-300 sm:h-auto sm:w-44">
                                          {lesson.coming_soon_image_url ? (
                                            <img
                                              src={lesson.coming_soon_image_url}
                                              alt={lesson.title}
                                              className="h-full w-full object-cover grayscale"
                                            />
                                          ) : null}
                                          <div className="absolute inset-0 bg-stone-900/40" />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                                              <Lock size={20} className="text-white" />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-1 items-center justify-between gap-4 p-4">
                                          <div className="flex items-start gap-4 sm:items-center">
                                            <Lock size={20} className="mt-0.5 text-stone-400 sm:mt-0" />
                                            <span className="text-base font-medium text-stone-500">
                                              {lessonIndex + 1}. {lesson.title}
                                            </span>
                                          </div>
                                          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
                                            Em breve
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4 sm:items-center">
                                          {lesson.type === 'video' ? (
                                            <PlayCircle size={20} className="mt-0.5 text-[#DBA1A2]/60 sm:mt-0" />
                                          ) : (
                                            <FileText size={20} className="mt-0.5 text-[#DBA1A2]/60 sm:mt-0" />
                                          )}
                                          <span className="text-base font-medium text-[#422523]">
                                            {lessonIndex + 1}. {lesson.title}
                                          </span>
                                        </div>
                                        {lesson.duration_minutes > 0 ? (
                                          <span className="text-xs font-bold tracking-widest text-[#422523]/30">
                                            {formatDuration(lesson.duration_minutes)}
                                          </span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="order-first mb-12 space-y-8 lg:order-last lg:sticky lg:top-24 lg:mb-0">
            <div className="rounded-[48px] border border-[#E7D8D8] bg-white p-8 shadow-[0_40px_100px_rgba(66,37,35,0.08)] sm:p-10">
              <div className="-mx-10 -mt-10 mb-8 hidden overflow-hidden rounded-t-[48px] lg:block">
                <img
                  src={course.thumbnail_url || FALLBACK_THUMBNAIL}
                  className="h-64 w-full border-b border-[#E7D8D8] object-cover"
                  alt="Thumbnail"
                />
              </div>

              <div className="mb-10 border-b border-[#F7F2ED] pb-8 text-center lg:text-left">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#DBA1A2]">
                  Bloco publicado
                </p>
                <h2 className="text-3xl font-serif font-medium leading-tight text-[#422523]">
                  Conteúdo aberto para as alunas da plataforma
                </h2>
                <p className="mt-4 text-sm font-light italic text-[#422523]/50">
                  Aulas, PDFs e materiais reunidos em um fluxo mais simples.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href={`/trilhas/${course.id}/aula`}
                  className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#422523] px-8 py-5 text-lg font-bold text-white transition-all duration-500 hover:bg-[#2C1917] hover:shadow-2xl hover:shadow-[#422523]/30"
                >
                  Abrir bloco agora
                  <PlayCircle size={22} />
                </Link>
              </div>

              <div className="mt-8 rounded-[32px] border border-[#E7D8D8] bg-[#F7F2ED]/50 p-6">
                <div className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#422523]/30">
                  O que você encontra aqui
                </div>
                <div className="flex items-center gap-4 text-sm font-light text-[#422523]">
                  <PlayCircle size={18} className="text-[#DBA1A2] opacity-60" />
                  <span className="flex-1">Aulas em vídeo e encontros gravados</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm font-light text-[#422523]">
                  <FileText size={18} className="text-[#DBA1A2] opacity-60" />
                  <span className="flex-1">PDFs e materiais de apoio por upload</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm font-light text-[#422523]">
                  <MessageSquareQuote size={18} className="text-[#DBA1A2] opacity-60" />
                  <span className="flex-1">Espaço para aprofundar a experiência da comunidade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
