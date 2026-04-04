'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Files,
  Loader2,
  Play,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import VideoPlayer from './VideoPlayer';
import LessonQA from './LessonQA';
import CertificateModal from './CertificateModal';

export default function CoursePlayer({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [progressLog, setProgressLog] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'materials' | 'discussion'>('content');

  const getLessonMaterials = (lesson: any) => Array.isArray(lesson?.materials) ? lesson.materials : [];
  const isPdfUrl = (url?: string | null) => Boolean(url && /\.pdf(\?|$)/i.test(url));
  const totalLessons = modules.reduce((count, module) => count + (module.lessons?.length || 0), 0);
  const completedLessons = progressLog.filter((progress) => progress.completed).length;
  const progressPercent = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : (enrollment?.progress_percent || 0);
  const canIssueCertificate = progressPercent >= 100 && enrollment?.status === 'completed';

  useEffect(() => {
    async function loadCourseData() {
      if (!user) return;

      try {
        const modulesWithMaterials = await supabase
          .from('modules')
          .select(`
            id, title, order_index,
            lessons (
              id, title, description, content_url, type, duration_minutes, order_index, materials
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
                  id, title, description, content_url, type, duration_minutes, order_index
                )
              `)
              .eq('course_id', courseId)
              .order('order_index', { ascending: true })
          : modulesWithMaterials;

        const [courseRes, enrollmentRes] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('enrollments').select('*').eq('profile_id', user.id).eq('course_id', courseId).maybeSingle(),
        ]);

        if (courseRes.data) setCourse(courseRes.data);

        const orderedModules = (modulesResult.data || []).map((module: any) => ({
          ...module,
          lessons: (module.lessons || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
        }));
        setModules(orderedModules);

        if (orderedModules.length > 0 && orderedModules[0].lessons.length > 0) {
          setCurrentLesson((prev: any) => prev || orderedModules[0].lessons[0]);
        }

        let enroll = enrollmentRes.data;
        if (!enroll) {
          const { data: newEnroll, error: insertError } = await supabase
            .from('enrollments')
            .insert({
              profile_id: user.id,
              course_id: courseId,
              status: 'active',
              progress_percent: 0,
            })
            .select('*')
            .single();

          if (!insertError) enroll = newEnroll;
        }
        setEnrollment(enroll);

        if (enroll) {
          const { data: progress } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('enrollment_id', enroll.id);
          setProgressLog(progress || []);
        }
      } catch (err) {
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourseData();
  }, [courseId, user, supabase]);

  useEffect(() => {
    setActiveTab('content');
  }, [currentLesson?.id]);

  useEffect(() => {
    if (!canIssueCertificate && showCertificate) {
      setShowCertificate(false);
    }
  }, [canIssueCertificate, showCertificate]);

  const refreshProgress = async () => {
    let currentEnrollment = enrollment;

    if (!currentEnrollment) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: newEnroll } = await supabase
        .from('enrollments')
        .select('*')
        .eq('profile_id', authUser.id)
        .eq('course_id', courseId)
        .single();

      if (newEnroll) {
        setEnrollment(newEnroll);
        currentEnrollment = newEnroll;
      } else {
        return;
      }
    }

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', currentEnrollment.id);
    setProgressLog(progress || []);

    const { data: updatedEnroll } = await supabase
      .from('enrollments')
      .select('progress_percent, status')
      .eq('id', currentEnrollment.id)
      .single();
    if (updatedEnroll) {
      setEnrollment((prev: any) => ({ ...prev, progress_percent: updatedEnroll.progress_percent, status: updatedEnroll.status }));
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progressLog.some((progress) => progress.lesson_id === lessonId && progress.completed);
  };

  const getNextLesson = () => {
    const flattenedLessons = modules.flatMap((module) => module.lessons);
    const currentIndex = flattenedLessons.findIndex((lesson) => lesson.id === currentLesson?.id);
    if (currentIndex >= 0 && currentIndex < flattenedLessons.length - 1) {
      return flattenedLessons[currentIndex + 1];
    }
    return null;
  };

  const toggleLessonCompletion = async (lessonId: string) => {
    if (isSyncing) return;
    setIsSyncing(lessonId);

    try {
      const isDone = isLessonCompleted(lessonId);
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          watchTime: 0,
          completed: !isDone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar progresso');
      }

      const payload = await res.json();
      await refreshProgress();

      if (payload && typeof payload.progressPercent === 'number') {
        setEnrollment((prev: any) => prev ? {
          ...prev,
          progress_percent: payload.progressPercent,
          status: payload.status,
        } : prev);
      }

      if (!isDone) {
        const next = getNextLesson();
        if (next) setCurrentLesson(next);
      }
    } catch (err) {
      console.error('Error toggling lesson completion:', err);
      alert('Nao foi possivel salvar seu progresso. Verifique sua conexao.');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleNextLesson = () => {
    const next = getNextLesson();
    if (next) {
      setCurrentLesson(next);
      window.scrollTo(0, 0);
    }
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
              <span className="whitespace-nowrap text-xs font-bold text-primary-600">{progressPercent}% Concluido</span>
            </div>
            <div className="mb-2 text-xs text-stone-500">
              {completedLessons} de {totalLessons} aula(s) concluida(s)
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-primary-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {canIssueCertificate ? (
            <button
              onClick={() => setShowCertificate(true)}
                className="motion-button shrink-0 rounded-lg bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-200"
            >
              <span className="flex items-center gap-2">
                <Award size={18} /> Emitir Certificado
              </span>
            </button>
          ) : null}
        </div>

        <div className="w-full bg-black shadow-inner">
          {currentLesson ? (
            currentLesson.type === 'video' && currentLesson.content_url ? (
              <VideoPlayer
                url={currentLesson.content_url}
                lessonId={currentLesson.id}
                courseId={courseId}
                onComplete={refreshProgress}
              />
            ) : currentLesson.content_url && isPdfUrl(currentLesson.content_url) ? (
              <div className="aspect-video w-full bg-stone-100">
                <iframe src={currentLesson.content_url} title={currentLesson.title} className="h-full w-full" />
              </div>
            ) : currentLesson.content_url ? (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-stone-900 px-6 text-center text-white">
                <FileText size={48} className="text-stone-500" />
                <p className="max-w-xl text-lg font-semibold">Esta aula possui um material principal externo.</p>
                <a
                  href={currentLesson.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-stone-900 transition hover:bg-primary-50"
                >
                  Abrir material <ExternalLink size={18} />
                </a>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-stone-900 text-white">
                <FileText size={48} className="text-stone-600" />
                <p>Nenhum video disponivel para esta aula.</p>
              </div>
            )
          ) : (
            <div className="flex aspect-video items-center justify-center text-white">Selecione uma aula no menu lateral.</div>
          )}
        </div>

        <div className="mx-auto max-w-5xl p-8 pb-32">
          {currentLesson ? (
            <>
              <div className="motion-float mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900">{currentLesson.title}</h1>
                  <p className="text-sm text-stone-500">
                    Parte da trilha <span className="font-semibold text-stone-700">{course?.title}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => toggleLessonCompletion(currentLesson.id)}
                    disabled={Boolean(isSyncing)}
                    className={`motion-button flex items-center gap-2 rounded-xl px-5 py-3 font-bold shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLessonCompleted(currentLesson.id)
                        ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isSyncing === currentLesson.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {isLessonCompleted(currentLesson.id) ? 'Desmarcar aula assistida' : 'Marcar aula como assistida'}
                  </button>

                  {getNextLesson() ? (
                    <button
                      onClick={handleNextLesson}
                      className="motion-button flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 font-bold text-white shadow-lg transition-all hover:translate-x-1 hover:bg-stone-800"
                    >
                      Proxima Aula <ChevronRight size={20} />
                    </button>
                  ) : null}
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
                      data-active={activeTab === 'content'}
                    >
                      <BookOpen size={16} />
                      <span>Conteudo da Aula</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('materials')}
                      className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeTab === 'materials' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                      }`}
                      data-active={activeTab === 'materials'}
                    >
                      <Files size={16} />
                      <span>Materiais</span>
                      {getLessonMaterials(currentLesson).length > 0 ? (
                        <span className="rounded-full bg-primary-700 px-2 py-0.5 text-[11px] text-white">
                          {getLessonMaterials(currentLesson).length}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('discussion')}
                      className={`motion-tab flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeTab === 'discussion' ? 'bg-primary-100 text-primary-800' : 'text-stone-500 hover:bg-stone-50'
                      }`}
                      data-active={activeTab === 'discussion'}
                    >
                      <FileText size={16} />
                      <span>Discussao</span>
                    </button>
                  </div>
                </div>

                {activeTab === 'content' ? (
                  <p className="text-lg leading-relaxed text-stone-600">{currentLesson.description}</p>
                ) : null}
              </div>

              {activeTab === 'materials' ? (
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
                              {isPdf ? <FileText size={20} /> : <Download size={20} />}
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

              {activeTab === 'discussion' ? (
                <div className="motion-card mt-10">
                  <LessonQA lessonId={currentLesson.id} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex h-auto w-full flex-shrink-0 flex-col border-t border-stone-200 bg-white lg:h-full lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="border-b border-stone-200 p-6">
          <h2 className="text-xl font-bold text-stone-900">Conteudo do Curso</h2>
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
                  const isDone = isLessonCompleted(lesson.id);
                  const lessonMaterialsCount = getLessonMaterials(lesson).length;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className={`motion-card flex items-start gap-4 p-4 text-left transition-colors ${
                        isActive ? 'border-l-4 border-l-primary-600 bg-primary-50' : 'border-l-4 border-l-transparent hover:bg-stone-50'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 rounded-full p-1 ${isDone ? 'bg-primary-100 text-primary-600' : isActive ? 'bg-primary-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                        {isDone ? <CheckCircle size={14} /> : <Play size={14} className={isActive ? 'fill-current' : ''} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`line-clamp-2 text-sm font-bold ${isActive ? 'text-primary-800' : 'text-stone-800'}`}>
                            {lessonIndex + 1}. {lesson.title}
                          </div>
                          {isActive ? (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleLessonCompletion(lesson.id);
                              }}
                              disabled={Boolean(isSyncing)}
                              className={`motion-button shrink-0 rounded-md p-1 text-white transition-colors ${
                                isDone
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-primary-600 hover:bg-primary-700'
                              }`}
                              title={isDone ? 'Desmarcar como assistida' : 'Marcar como concluida'}
                            >
                              {isSyncing === lesson.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                          {lesson.type === 'video' ? <Play size={10} /> : <FileText size={10} />}
                          {lesson.duration_minutes > 0
                            ? `${lesson.duration_minutes} min${lessonMaterialsCount > 0 ? ` • ${lessonMaterialsCount} material(is)` : ''}`
                            : lessonMaterialsCount > 0
                              ? `${lessonMaterialsCount} material(is)`
                              : 'Leitura'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCertificate ? (
        <CertificateModal
          courseId={courseId}
          courseTitle={course?.title || 'Curso'}
          userName={user?.name || 'Aluno'}
          onClose={() => setShowCertificate(false)}
        />
      ) : null}
    </div>
  );
}
