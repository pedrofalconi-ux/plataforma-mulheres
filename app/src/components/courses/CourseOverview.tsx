'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, PlayCircle, FileText, CheckCircle2, Lock, ShieldCheck, Clock, BookOpen, User, Play, Loader2, Award, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';
const DEFAULT_BENEFITS = [
  "Fundamentos teóricos e práticos aplicados.",
  "Acesso a metodologias exclusivas do Ecossistema.",
  "Avaliações progressivas de conhecimento.",
  "Certificado de conclusão reconhecido."
];

export default function CourseOverview({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    async function loadCourseDetails() {
      if (!user) return;
      try {
        const [courseRes, modulesRes, enrollmentRes] = await Promise.all([
          supabase.from('courses').select('*, categories(name, slug)').eq('id', courseId).single(),
          supabase.from('modules').select(`
            id, title, order_index, description,
            lessons (
              id, title, description, type, duration_minutes, order_index
            )
          `).eq('course_id', courseId).order('order_index', { ascending: true }),
          supabase.from('enrollments').select('*').eq('profile_id', user.id).eq('course_id', courseId).maybeSingle()
        ]);

        if (courseRes.data) {
          let parsedBenefits = DEFAULT_BENEFITS;
          if (courseRes.data.benefits) {
             try {
               parsedBenefits = typeof courseRes.data.benefits === 'string' ? JSON.parse(courseRes.data.benefits) : courseRes.data.benefits;
             } catch(e) {}
          }
          setCourse({ ...courseRes.data, parsedBenefits });
        }

        const orderedModules = (modulesRes.data || []).map(m => ({
          ...m,
          lessons: m.lessons.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        }));
        setModules(orderedModules);

        if (orderedModules.length > 0) {
          setOpenModules({ [orderedModules[0].id]: true });
        }

        if (enrollmentRes.data) {
          setEnrollment(enrollmentRes.data);
        }
      } catch (err) {
        console.error("Error loading course overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseDetails();
  }, [courseId, user, supabase]);

  const toggleModule = (id: string) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao adicionar ao carrinho');
        return;
      }
      // Force reload or redirect to cart
      alert('Curso adicionado ao carrinho com sucesso!');
      window.dispatchEvent(new Event('cart-updated')); // Optional custom event
      router.push('/carrinho');
    } catch(err) {
      alert('Erro inesperado ao adicionar ao carrinho.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-50">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center text-stone-500">Curso não encontrado.</div>;
  }

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalDuration = modules.reduce(
    (acc, m) => acc + (m.lessons?.reduce((lAcc: number, l: any) => lAcc + (l.duration_minutes || 0), 0) || 0),
    0
  );

  const formatDuration = (mins: number) => {
    if (mins === 0) return '0 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const isEnrolled = !!(enrollment && ['active', 'completed'].includes(enrollment.status));
  const progressPercent = enrollment?.progress_percent || 0;
  const isStarted = progressPercent > 0;
  
  const instructorName = course.instructor_name || 'Especialistas do Ecossistema';
  const instructorDesc = course.instructor_description || 'Nossa equipe de especialistas da área que produz os melhores conteúdos focados no cuidado para a dignidade humana.';
  const coursePrice = typeof course.price === 'number' ? course.price : parseFloat(course.price || '0');

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={course.thumbnail_url || FALLBACK_THUMBNAIL} 
            alt={course.title} 
            className="h-full w-full object-cover opacity-20 grayscale transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary-600/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-400 border border-primary-500/30">
                {course.level || 'Iniciante'}
              </span>
              {course.categories && (
                <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-stone-300">
                  {course.categories.name}
                </span>
              )}
            </div>
            
            <h1 className="mb-4 lg:mb-6 font-serif text-3xl sm:text-4xl font-bold leading-tight lg:text-5xl text-white">
              {course.title}
            </h1>
            
            <p className="mb-8 text-lg text-stone-300 leading-relaxed max-w-2xl font-light">
              {course.description || "Aprofunde seus conhecimentos nesta trilha formativa completa, pensada para construir bases sólidas no seu desenvolvimento."}
            </p>

            <div className="flex flex-wrap gap-6 text-sm font-medium text-stone-300">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary-500" />
                <span>{modules.length} seções ({totalLessons} aulas)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary-500" />
                <span>Duração: ~{formatDuration(totalDuration)}</span>
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
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-3 lg:items-start">
          
          <div className="lg:col-span-2 space-y-12">
            
            <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6 flex items-center gap-3">
                O que você vai aprender
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {course.parsedBenefits?.map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 text-primary-600 shrink-0" size={20} />
                    <span className="text-stone-700 text-sm leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-end justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">Grade Curricular</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {modules.length} seções • {totalLessons} aulas • Duração total: ~{formatDuration(totalDuration)}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const allOpen = Object.values(openModules).every(v => v);
                    const newState = modules.reduce((acc, m) => ({ ...acc, [m.id]: !allOpen }), {});
                    setOpenModules(newState);
                  }}
                  className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors hidden sm:block"
                >
                  Expanda todas as seções
                </button>
              </div>

              <div className="space-y-4">
                {modules.length === 0 ? (
                  <p className="text-stone-500 text-center py-10">Módulos em estruturação...</p>
                ) : (
                  modules.map((module, index) => {
                    const isOpen = openModules[module.id];
                    const moduleLessons = module.lessons || [];
                    
                    return (
                      <div key={module.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-primary-200">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="flex w-full items-center justify-between bg-stone-50 border-b border-stone-100 p-4 sm:p-5 text-left transition-colors hover:bg-stone-100 focus:outline-none"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-stone-400 font-bold w-6 text-center">{index + 1}</span>
                            <div>
                              <h3 className="font-bold text-stone-900 text-base sm:text-lg">{module.title}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-stone-500 hidden sm:block">{moduleLessons.length} aulas</span>
                            <ChevronDown className={`text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="bg-white">
                            {moduleLessons.length === 0 ? (
                              <p className="py-4 text-sm text-stone-500 text-center">Nenhuma aula gravada neste módulo ainda.</p>
                            ) : (
                              <div className="flex flex-col">
                                {moduleLessons.map((lesson: any, idx: number) => (
                                  <div key={lesson.id} className="group flex items-center justify-between px-5 py-3 sm:py-4 transition-colors hover:bg-stone-50 border-b border-stone-50 last:border-0">
                                    <div className="flex items-start sm:items-center gap-3">
                                      {lesson.type === 'video' ? (
                                        <PlayCircle size={18} className="text-primary-400 mt-0.5 sm:mt-0" />
                                      ) : (
                                        <FileText size={18} className="text-primary-400 mt-0.5 sm:mt-0" />
                                      )}
                                      <div>
                                        <span className="text-sm font-medium text-stone-700">
                                          {lesson.title}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      {lesson.duration_minutes > 0 && (
                                        <span className="text-xs text-stone-400">{formatDuration(lesson.duration_minutes)}</span>
                                      )}
                                      {!isEnrolled && <Lock size={14} className="text-stone-300" />}
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
            
            <section className="pt-6 border-t border-stone-200">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">Requisitos</h2>
              <ul className="list-disc pl-5 text-stone-700 space-y-2 mb-8 text-sm sm:text-base">
                 <li>Vontade de aprender e aplicar o conhecimento em projetos de vida ou de sociedade.</li>
                 <li>Acesso contínuo à internet para assistir aos recursos em vídeo.</li>
              </ul>

              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">Descrição</h2>
              <div className="prose prose-stone max-w-none text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                 {course.description || "Este curso abrange de maneira aprofundada os tópicos e fundamentos..."}
              </div>
            </section>
            
          </div>

          <div className="order-first lg:order-last lg:sticky lg:top-24 space-y-6 mb-8 lg:mb-0">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/50">
              <div className="hidden lg:block -mx-6 -mt-6 mb-6">
                 <img src={course.thumbnail_url || FALLBACK_THUMBNAIL} className="w-full h-48 object-cover rounded-t-2xl border-b border-stone-100" alt="Thumbnail" />
              </div>

              {!isEnrolled ? (
                <>
                  <div className="mb-6 border-b border-stone-100 pb-6 text-center lg:text-left">
                    <p className="text-sm font-bold uppercase tracking-wide text-primary-600 mb-2">Plano Único</p>
                    {coursePrice > 0 ? (
                      <h2 className="text-4xl font-black text-stone-900 mb-1 lg:flex items-center gap-2">
                        <span className="text-2xl font-bold text-stone-400">R$</span>
                        {coursePrice.toFixed(2).replace('.', ',')}
                      </h2>
                    ) : (
                      <h2 className="text-4xl font-black text-green-600 mb-1">
                        Gratuito
                      </h2>
                    )}
                    <p className="text-sm text-stone-500">Acesso completo à trilha.</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <button 
                      onClick={() => router.push(`/checkout?courseId=${course.id}`)}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-lg hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-primary-600/30"
                    >
                      Assinar e Iniciar
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                    <button 
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-6 py-3 text-sm font-bold text-stone-700 transition-all duration-300 hover:bg-stone-50 hover:border-stone-300 hover:-translate-y-1 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
                    >
                      {isAddingToCart ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                      {isAddingToCart ? 'Adicionando...' : 'Adicionar ao carrinho'}
                    </button>
                  </div>
                  <p className="text-center text-xs text-stone-400 mb-6">Garantia de devolução do dinheiro em 7 dias.</p>
                </>
              ) : (
                <>
                  <div className="mb-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide mb-4">
                      <CheckCircle2 size={16} /> Você já possui este curso
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-stone-500">Progresso Atual</span>
                        <span className="text-sm font-bold text-primary-600">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 transition-all duration-500 ease-out" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={() => router.push(`/trilhas/${course.id}/aula`)}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-stone-800 hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-lg shadow-stone-900/20"
                    >
                      {isStarted ? 'Continuar Trilha' : 'Iniciar Trilha'}
                      <Play size={18} className="fill-current" />
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-3 rounded-xl bg-stone-50 p-4 border border-stone-100">
                <div className="text-sm font-bold text-stone-800 mb-2">Este curso inclui:</div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <PlayCircle size={16} /> <span className="flex-1">{totalDuration > 0 ? `${Math.round(totalDuration / 60)} horas` : 'Diversas horas'} de vídeo sob demanda</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <FileText size={16} /> <span className="flex-1">Materiais de apoio focados</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <Award size={16} /> <span className="flex-1">Certificado de conclusão</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
               <h3 className="font-bold text-stone-900 mb-4">Instrutores</h3>
               <div className="flex items-start gap-4 mb-4">
                 {course.instructor_avatar_url ? (
                   <img src={course.instructor_avatar_url} alt="Instructor" className="h-12 w-12 rounded-full object-cover shrink-0" />
                 ) : (
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 shrink-0 overflow-hidden">
                      <User size={24} />
                   </div>
                 )}
                 <div>
                   <p className="font-bold text-stone-900 text-sm">{instructorName}</p>
                   <p className="text-xs text-stone-500 mt-0.5">Classificação 4.8 / 5.0</p>
                 </div>
               </div>
               <p className="text-xs text-stone-600 leading-relaxed">
                 {instructorDesc}
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
