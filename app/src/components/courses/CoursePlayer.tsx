'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Files,
  Loader2,
  Lock,
  MessageCircle,
  Play,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import LessonQA from './LessonQA';
import LessonActivity from './LessonActivity';

function getLessonMaterials(lesson: any) {
  return Array.isArray(lesson?.materials) ? lesson.materials : [];
}

function getLessonActivityQuestions(lesson: any) {
  if (!Array.isArray(lesson?.activity_questions)) return [];

  return lesson.activity_questions
    .map((item: unknown) => {
      if (typeof item === 'string') {
        const prompt = item.trim();
        return prompt ? { prompt } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const prompt = String((item as Record<string, unknown>).prompt || '').trim();
      return prompt ? { prompt } : null;
    })
    .filter((item: { prompt: string } | null): item is { prompt: string } => Boolean(item));
}

function isPdfUrl(url?: string | null) {
  return Boolean(url && /\.pdf(\?|$)/i.test(url));
}

function getYouTubeId(url?: string | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function isLessonComingSoon(lesson: any) {
  return Boolean(lesson?.is_coming_soon);
}

function formatLessonMeta(lesson: any) {
  if (isLessonComingSoon(lesson)) {
    return 'Em breve';
  }

  const materialsCount = getLessonMaterials(lesson).length;
  if (lesson.duration_minutes > 0 && materialsCount > 0) {
    return `${lesson.duration_minutes} min • ${materialsCount} material(is)`;
  }
  if (lesson.duration_minutes > 0) {
    return `${lesson.duration_minutes} min`;
  }
  if (materialsCount > 0) {
    return `${materialsCount} material(is)`;
  }
  return lesson.type === 'video' ? 'Video' : 'Leitura';
}

export default function CoursePlayer({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'materials' | 'activity' | 'discussion'>('content');

  useEffect(() => {
    async function loadCourseData() {
      try {
        const modulesWithMaterials = await supabase
          .from('modules')
          .select(`
            id, title, order_index,
            lessons (
              id, title, description, content_url, type, duration_minutes, is_coming_soon, coming_soon_image_url, order_index, materials, activity_questions
            )
          `)
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        const modulesResult = modulesWithMaterials.error
          ? await supabase
              .from('modules')
              .select(`
                id, title, order_index,
                lessons (
                  id, title, description, content_url, type, duration_minutes, is_coming_soon, coming_soon_image_url, order_index, activity_questions
                )
              `)
              .eq('course_id', courseId)
              .order('order_index', { ascending: true })
          : modulesWithMaterials;

        const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();

        if (courseData) setCourse(courseData);

        const orderedModules = (modulesResult.data || []).map((module: any) => ({
          ...module,
          lessons: (module.lessons || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
        }));

        setModules(orderedModules);

        const firstAvailableLesson =
          orderedModules.flatMap((module: any) => module.lessons || []).find((lesson: any) => !isLessonComingSoon(lesson)) || null;

        setCurrentLesson(firstAvailableLesson);
      } catch (err) {
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadCourseData();
  }, [courseId, supabase]);

  useEffect(() => {
    setActiveTab('content');
  }, [currentLesson?.id]);

  const totalLessons = useMemo(
    () => modules.reduce((count, module) => count + (module.lessons?.length || 0), 0),
    [modules],
  );

  const flattenedLessons = useMemo(() => modules.flatMap((module) => module.lessons || []), [modules]);
  const currentLessonIndex = flattenedLessons.findIndex((lesson) => lesson.id === currentLesson?.id);
  const currentLessonQuestions = getLessonActivityQuestions(currentLesson);

  const renderLessonMedia = () => {
    if (isLessonComingSoon(currentLesson)) {
      return (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden bg-stone-900 px-6 text-center text-white">
          {currentLesson?.coming_soon_image_url ? (
            <>
              <img
                src={currentLesson.coming_soon_image_url}
                alt={currentLesson.title}
                className="absolute inset-0 h-full w-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-stone-950/55" />
            </>
          ) : null}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
            <Lock size={28} className="text-stone-200" />
          </div>
          <p className="relative text-xl font-semibold">Esta aula sera liberada em breve.</p>
          <p className="relative max-w-xl text-sm text-stone-300">
            Assim que a gravacao estiver disponivel, ela aparecera aqui para as alunas da plataforma.
          </p>
        </div>
      );
    }

    if (!currentLesson?.content_url) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-stone-900 text-white">
          <FileText size={48} className="text-stone-600" />
          <p>Nenhum conteudo principal disponivel para esta aula.</p>
        </div>
      );
    }

    const youtubeId = getYouTubeId(currentLesson.content_url);
    if (youtubeId) {
      return (
        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={currentLesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    if (isPdfUrl(currentLesson.content_url)) {
      return (
        <div className="aspect-video w-full bg-stone-100">
          <iframe src={currentLesson.content_url} title={currentLesson.title} className="h-full w-full" />
        </div>
      );
    }

    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-stone-900 px-6 text-center text-white">
        <FileText size={48} className="text-stone-500" />
        <p className="max-w-xl text-lg font-semibold">Esta aula possui um arquivo principal anexado.</p>
        <a
          href={currentLesson.content_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-stone-900 transition hover:bg-primary-50"
        >
          Abrir arquivo <ExternalLink size={18} />
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="motion-shell flex min-h-[calc(100vh-80px)] flex-col lg:h-[calc(100vh-80px)] lg:flex-row">
      <div className="flex-1 overflow-y-auto bg-stone-50">
        <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-stone-200 bg-white/92 px-6 py-4 backdrop-blur">
          <Link href="/trilhas" className="text-stone-400 transition-colors hover:text-stone-800">
            <ChevronRight size={20} className="rotate-180" />
          </Link>
          <div className="flex-1">
            <div className="mb-2 flex items-end justify-between">
              <span className="line-clamp-1 font-bold text-stone-800">{course?.title}</span>
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
                Acesso liberado
              </span>
            </div>
            <div className="text-xs text-stone-500">
              {totalLessons} aula(s) publicadas • {currentLessonIndex >= 0 ? `Aula ${currentLessonIndex + 1}` : 'Selecione uma aula'}
            </div>
          </div>
        </div>

        <div className="w-full bg-black shadow-inner">{renderLessonMedia()}</div>

        <div className="mx-auto max-w-5xl p-8 pb-32">
          {currentLesson ? (
            <>
              <div className="motion-float mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900">{currentLesson.title}</h1>
                  <p className="text-sm text-stone-500">
                    Parte do bloco <span className="font-semibold text-stone-700">{course?.title}</span>
                  </p>
                </div>
              </div>

              <div className="prose prose-stone max-w-none">
                <div className="not-prose mb-6 overflow-x-auto">
                  <div className="inline-flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeTab === 'content' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      <BookOpen size={16} />
                      <span>Conteudo da Aula</span>
                    </button>
                    {!isLessonComingSoon(currentLesson) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('materials')}
                          className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                            activeTab === 'materials' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          <Files size={16} />
                          <span>Materiais</span>
                          {getLessonMaterials(currentLesson).length > 0 ? (
                            <span className="rounded-full bg-primary-700 px-2 py-0.5 text-[11px] text-white">
                              {getLessonMaterials(currentLesson).length}
                            </span>
                          ) : null}
                        </button>
                        {currentLessonQuestions.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab('activity')}
                            className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                              activeTab === 'activity' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                            }`}
                          >
                            <ClipboardList size={16} />
                            <span>Atividade</span>
                            <span className="rounded-full bg-primary-700 px-2 py-0.5 text-[11px] text-white">
                              {currentLessonQuestions.length}
                            </span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setActiveTab('discussion')}
                          className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                            activeTab === 'discussion' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          <MessageCircle size={16} />
                          <span>Discussao</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {activeTab === 'content' ? (
                  <div className="rounded-[28px] border border-primary-900/8 bg-white p-6 shadow-sm">
                    <p className="text-lg leading-relaxed text-stone-600">
                      {isLessonComingSoon(currentLesson)
                        ? 'Esta aula ainda nao foi gravada. Em breve ela sera liberada aqui com todo o conteudo.'
                        : currentLesson.description || 'Esta aula ainda nao possui uma descricao detalhada.'}
                    </p>
                  </div>
                ) : null}
              </div>

              {activeTab === 'materials' && !isLessonComingSoon(currentLesson) ? (
                <div className="motion-card mt-10 rounded-[28px] border border-primary-900/8 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                      <Files size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-stone-900">Materiais complementares</h2>
                      <p className="text-sm text-stone-500">Abra, baixe e consulte os apoios desta aula.</p>
                    </div>
                  </div>

                  {getLessonMaterials(currentLesson).length > 0 ? (
                    <div className="motion-list mt-5 grid gap-3">
                      {getLessonMaterials(currentLesson).map((material: any, index: number) => {
                        const isPdf = material.kind === 'pdf' || isPdfUrl(material.url);

                        return (
                          <a
                            key={`${material.url}-${index}`}
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="motion-card flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 transition hover:border-primary-200 hover:bg-primary-50"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-sm">
                              {isPdf ? <FileText size={20} /> : <ExternalLink size={20} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-stone-900">{material.title}</div>
                              <div className="text-sm text-stone-500">
                                {isPdf ? 'PDF complementar' : material.kind === 'download' ? 'Arquivo para download' : 'Link de apoio'}
                              </div>
                            </div>
                            <ExternalLink size={18} className="shrink-0 text-stone-400" />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="motion-card mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                      Esta aula ainda nao possui materiais complementares cadastrados.
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'activity' && !isLessonComingSoon(currentLesson) ? (
                user ? (
                  <div className="motion-card mt-10">
                    <LessonActivity lessonId={currentLesson.id} initialQuestions={currentLessonQuestions} />
                  </div>
                ) : (
                  <div className="motion-card mt-10 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                    Entre com sua conta para responder a atividade desta aula.
                  </div>
                )
              ) : null}

              {activeTab === 'discussion' && !isLessonComingSoon(currentLesson) ? (
                user ? (
                  <div className="motion-card mt-10">
                    <LessonQA lessonId={currentLesson.id} />
                  </div>
                ) : (
                  <div className="motion-card mt-10 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                    Entre com sua conta apenas se quiser participar da discussao. O acesso ao conteudo continua aberto mesmo sem login.
                  </div>
                )
              ) : null}
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-6 py-12 text-center text-stone-500">
              Nenhuma aula disponivel para assistir neste bloco ainda.
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex h-auto w-full flex-shrink-0 flex-col border-t border-stone-200 bg-white lg:h-full lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="border-b border-stone-200 p-6">
          <h2 className="text-xl font-bold text-stone-900">Conteudo do Bloco</h2>
        </div>

        <div className="motion-list flex-1 overflow-y-auto">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-stone-100">
              <div className="bg-stone-50 p-4 text-sm font-bold uppercase tracking-wide text-stone-800">
                Modulo {moduleIndex + 1}: {module.title}
              </div>
              <div className="flex flex-col">
                {module.lessons.map((lesson: any, lessonIndex: number) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isComingSoon = isLessonComingSoon(lesson);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        if (!isComingSoon) {
                          setCurrentLesson(lesson);
                        }
                      }}
                      disabled={isComingSoon}
                      className={`motion-card flex items-start gap-4 p-4 text-left transition-colors ${
                        isComingSoon
                          ? 'cursor-not-allowed border-l-4 border-l-transparent bg-stone-100'
                          : isActive
                            ? 'border-l-4 border-l-primary-600 bg-primary-50'
                            : 'border-l-4 border-l-transparent hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 shrink-0 rounded-full p-1 ${
                          isComingSoon
                            ? 'bg-stone-200 text-stone-500'
                            : isActive
                              ? 'bg-primary-600 text-white'
                              : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {isComingSoon ? <Lock size={14} /> : <Play size={14} className={isActive ? 'fill-current' : ''} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`line-clamp-2 text-sm font-bold ${isComingSoon ? 'text-stone-500' : isActive ? 'text-primary-800' : 'text-stone-800'}`}>
                          {lessonIndex + 1}. {lesson.title}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">{formatLessonMeta(lesson)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
