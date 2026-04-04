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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F7F2ED]">
        <Loader2 className="animate-spin text-[#DBA1A2]" size={48} />
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center text-stone-500">Trilha não encontrada.</div>;
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
  
  const instructorName = course.instructor_name || 'Nathi Faria';
  const instructorDesc = course.instructor_description || 'Especialista em desenvolvimento humano e virtudes, dedicada a construir lares com propósito e alma.';

  return (
    <div className="min-h-screen bg-[#F7F2ED] pb-20">
      <div className="relative overflow-hidden bg-[#422523] text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={course.thumbnail_url || FALLBACK_THUMBNAIL} 
            alt={course.title} 
            className="h-full w-full object-cover opacity-20 grayscale transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#422523] via-[#422523]/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-[#DBA1A2]/20 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#DBA1A2] border border-[#DBA1A2]/30">
                {course.level || 'Essencial'}
              </span>
              {course.categories && (
                <span className="rounded-full bg-white/5 px-4 py-1.5 text-[11px] font-medium text-stone-300 backdrop-blur-sm">
                  {course.categories.name}
                </span>
              )}
            </div>
            
            <h1 className="mb-4 lg:mb-8 font-serif text-4xl sm:text-5xl font-medium leading-tight lg:text-7xl text-white tracking-tight">
              {course.title}
            </h1>
            
            <p className="mb-10 text-xl text-stone-300 leading-relaxed max-w-2xl font-light">
              {course.description || "Inicie sua jornada nesta trilha formativa completa, pensada para construir bases sólidas no seu desenvolvimento pessoal e familiar."}
            </p>

            <div className="flex flex-wrap gap-8 text-sm font-bold text-stone-300 uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-[#DBA1A2]" />
                <span>{modules.length} Seções</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-[#DBA1A2]" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
              <div className="flex items-center gap-3 text-[#DBA1A2]">
                <CheckCircle2 size={20} />
                <span>Certificação Inclusa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-3 lg:items-start">
          
          <div className="lg:col-span-2 space-y-16">
            
            <section className="rounded-[40px] border border-[#E7D8D8] bg-white p-10 sm:p-14 shadow-[0_20px_60px_rgba(66,37,35,0.03)]">
              <h2 className="font-serif text-3xl font-medium text-[#422523] mb-10 border-b border-[#F7F2ED] pb-6">
                O que você vai viver nesta jornada
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {course.parsedBenefits?.map((benefit: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="h-6 w-6 rounded-full bg-[#F7F2ED] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#DBA1A2] transition-colors">
                      <CheckCircle2 className="text-[#DBA1A2] group-hover:text-white transition-colors" size={14} />
                    </div>
                    <span className="text-[#422523] text-base leading-relaxed font-light">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-10 flex items-end justify-between border-b border-[#E7D8D8] pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-medium text-[#422523]">Grade Curricular</h2>
                  <p className="mt-2 text-sm text-[#422523]/40 font-bold uppercase tracking-widest">
                    {modules.length} seções • {totalLessons} aulas • {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {modules.length === 0 ? (
                  <p className="text-stone-500 text-center py-10 font-serif">A trilha está sendo preparada para você...</p>
                ) : (
                  modules.map((module, index) => {
                    const isOpen = openModules[module.id];
                    const moduleLessons = module.lessons || [];
                    
                    return (
                      <div key={module.id} className="overflow-hidden rounded-[32px] border border-[#E7D8D8] bg-white transition-all shadow-sm hover:shadow-md">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="flex w-full items-center justify-between p-6 sm:p-8 text-left transition-colors hover:bg-[#F7F2ED]/30 focus:outline-none"
                        >
                          <div className="flex items-center gap-6">
                            <span className="text-[#DBA1A2] font-black text-xl w-8 text-center opacity-40">{index + 1}</span>
                            <div>
                              <h3 className="font-serif font-medium text-[#422523] text-xl sm:text-2xl">{module.title}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-[#422523]/40 uppercase tracking-[0.2em] hidden sm:block">{moduleLessons.length} aulas</span>
                            <ChevronDown className={`text-[#DBA1A2] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} size={24} />
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="bg-white px-8 pb-8 pt-2">
                            {moduleLessons.length === 0 ? (
                              <p className="py-4 text-sm text-stone-500 text-center font-light">Nenhuma aula disponível neste módulo.</p>
                            ) : (
                              <div className="space-y-2 border-t border-[#F7F2ED] pt-6">
                                {moduleLessons.map((lesson: any, idx: number) => (
                                  <div key={lesson.id} className="group flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-[#F7F2ED]/50">
                                    <div className="flex items-start sm:items-center gap-4">
                                      {lesson.type === 'video' ? (
                                        <PlayCircle size={20} className="text-[#DBA1A2]/60 mt-0.5 sm:mt-0" />
                                      ) : (
                                        <FileText size={20} className="text-[#DBA1A2]/60 mt-0.5 sm:mt-0" />
                                      )}
                                      <span className="text-base font-medium text-[#422523] group-hover:text-black transition-colors">
                                        {lesson.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0">
                                      {lesson.duration_minutes > 0 && (
                                        <span className="text-xs font-bold text-[#422523]/30 tracking-widest">{formatDuration(lesson.duration_minutes)}</span>
                                      )}
                                      {!isEnrolled && <Lock size={16} className="text-[#DBA1A2]/30" />}
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

          <div className="order-first lg:order-last lg:sticky lg:top-24 space-y-8 mb-12 lg:mb-0">
            <div className="rounded-[48px] border border-[#E7D8D8] bg-white p-8 sm:p-10 shadow-[0_40px_100px_rgba(66,37,35,0.08)]">
              <div className="hidden lg:block -mx-10 -mt-10 mb-8 overflow-hidden rounded-t-[48px]">
                 <img src={course.thumbnail_url || FALLBACK_THUMBNAIL} className="w-full h-64 object-cover border-b border-[#E7D8D8] transition-transform duration-1000 hover:scale-105" alt="Thumbnail" />
              </div>

              {!isEnrolled ? (
                <>
                  <div className="mb-10 text-center lg:text-left border-b border-[#F7F2ED] pb-8">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#DBA1A2] mb-4">Inscrições Abertas</p>
                    <h2 className="text-3xl font-serif font-medium text-[#422523] leading-tight text-balance">
                      Acesso Exclusivo à Comunidade
                    </h2>
                    <p className="mt-4 text-sm text-[#422523]/50 font-light italic">Seja bem-vinda ao atelier digital.</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <Link
                      href="/cadastro" 
                      className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#422523] px-8 py-5 text-lg font-bold text-white transition-all duration-500 hover:bg-[#2C1917] hover:shadow-2xl hover:shadow-[#422523]/30 hover:-translate-y-1 active:scale-[0.98]"
                    >
                      Entrar para Acessar
                      <ChevronRight size={22} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <p className="text-center text-[10px] text-[#422523]/40 font-bold uppercase tracking-widest mb-2">Plataforma de Alunas</p>
                </>
              ) : (
                <>
                  <div className="mb-10 text-center lg:text-left">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#F7F2ED] text-[#DBA1A2] text-xs font-black uppercase tracking-widest mb-8 border border-[#DBA1A2]/10">
                      <CheckCircle2 size={18} /> MATRICULADA
                    </div>
                    <div className="mb-6 px-2">
                      <div className="flex justify-between items-end mb-3 font-black text-[#422523]/30 uppercase tracking-[0.2em] text-[10px]">
                        <span>Progresso na Trilha</span>
                        <span className="text-sm font-serif text-[#422523]">{progressPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-[#F7F2ED] rounded-full overflow-hidden p-0.5 border border-[#E7D8D8]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#DBA1A2] to-[#E7D8D8] rounded-full transition-all duration-1500 ease-in-out" 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <button 
                      onClick={() => router.push(`/trilhas/${course.id}/aula`)}
                      className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-[#422523] px-8 py-5 text-lg font-bold text-white transition-all duration-500 hover:bg-[#2C1917] hover:shadow-2xl hover:shadow-[#422523]/30 hover:-translate-y-1 active:scale-[0.98]"
                    >
                      {isStarted ? 'Continuar de onde parou' : 'Iniciar Trilha'}
                      <PlayCircle size={22} />
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-4 rounded-[32px] bg-[#F7F2ED]/50 p-6 border border-[#E7D8D8]">
                <div className="text-[11px] font-black text-[#422523]/30 uppercase tracking-[0.2em] mb-4">O que inclui</div>
                <div className="flex items-center gap-4 text-sm text-[#422523] font-light">
                  <PlayCircle size={18} className="text-[#DBA1A2] opacity-60" /> <span className="flex-1">Aulas em altíssima definição</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#422523] font-light">
                  <FileText size={18} className="text-[#DBA1A2] opacity-60" /> <span className="flex-1">Materiais teóricos e práticos</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#422523] font-light">
                  <Award size={18} className="text-[#DBA1A2] opacity-60" /> <span className="flex-1">Certificação de conclusão</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-[40px] border border-[#E7D8D8] bg-white p-8 shadow-sm">
               <h3 className="font-serif text-2xl font-medium text-[#422523] mb-8">Instrutora</h3>
               <div className="flex items-center gap-5 mb-6">
                 <div className="h-16 w-16 rounded-full bg-[#Vanilla Ice] flex items-center justify-center text-[#DBA1A2] font-black border border-[#DBA1A2]/20 text-xl overflow-hidden shadow-inner">
                    NF
                 </div>
                 <div>
                   <p className="font-serif font-medium text-[#422523] text-lg">{instructorName}</p>
                   <p className="text-[10px] font-black text-[#DBA1A2] uppercase tracking-[0.2em] mt-1">Fundadora</p>
                 </div>
               </div>
               <p className="text-sm text-[#422523]/60 leading-relaxed font-light italic">
                 {instructorDesc}
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
