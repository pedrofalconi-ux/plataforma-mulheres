'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Clock3, Loader2, ShoppingBag, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { BRAND_NAME } from '@/lib/constants';

type DashboardCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  thumbnail: string;
  progress: number;
  totalModules: number;
  isEnrolled: boolean;
  price: number;
  durationMinutes: number;
};

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';

function formatDuration(durationMinutes: number) {
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function CourseThumbnail({ src, alt, fill, className, sizes }: { src: string, alt: string, fill?: boolean, className?: string, sizes?: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      onError={() => setImgSrc(FALLBACK_THUMBNAIL)}
      unoptimized={src.startsWith('http') && !src.includes('supabase')}
    />
  );
}

export function CourseDashboard() {
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [activeTab, setActiveTab] = useState<'my_courses' | 'catalog'>('my_courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user;

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        let enrollmentsData: Array<{ course_id: string; progress_percent: number }> = [];
        if (currentUser) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('course_id, progress_percent')
            .eq('profile_id', currentUser.id);

          if (enrollmentsError) throw enrollmentsError;
          enrollmentsData = enrollments || [];
        }

        const mappedCourses: DashboardCourse[] = (coursesData || []).map((course: any) => {
          const enrollment = enrollmentsData.find((item) => item.course_id === course.id);

          return {
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description || 'Descrição em breve.',
            level: course.level || 'Iniciante',
            thumbnail: course.thumbnail_url || FALLBACK_THUMBNAIL,
            progress: enrollment?.progress_percent || 0,
            totalModules: course.total_modules || 0,
            isEnrolled: !!enrollment,
            price: Number(course.price) || 0,
            durationMinutes: Number(course.duration_minutes) || 0,
          };
        });

        setCourses(mappedCourses);
        if (currentUser && mappedCourses.filter((course) => course.isEnrolled).length === 0) {
          setActiveTab('catalog');
        }
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError('Não foi possível carregar suas jornadas agora. Tente novamente em instantes.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [supabase]);

  const handleAddToCart = async (courseId: string) => {
    if (!user) {
      router.push('/login?redirect=/trilhas');
      return;
    }

    setCheckoutLoading(courseId);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });

      const data = await response.json();
      if (response.ok) {
        window.dispatchEvent(new Event('cart-updated'));
        alert('Curso adicionado ao seu carrinho!');
      } else {
        alert(data.error || 'Erro ao adicionar ao carrinho.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao processar carrinho.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const myCourses = courses.filter((course) => course.isEnrolled);
  const inProgressCourses = myCourses.filter((course) => course.progress > 0 && course.progress < 100);
  const nextCourse = inProgressCourses[0] || myCourses[0] || null;
  const displayedCourses = activeTab === 'my_courses' ? myCourses : courses;
  const averageProgress = myCourses.length > 0 ? Math.round(myCourses.reduce((total, course) => total + course.progress, 0) / myCourses.length) : 0;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="hero-sheen motion-float relative overflow-hidden rounded-[36px] px-6 py-10 text-white shadow-[0_25px_80px_rgba(22,63,46,0.18)] sm:px-8 lg:px-10">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-100">
                <Sparkles size={14} />
                Área de aprendizagem {BRAND_NAME}
              </p>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                {activeTab === 'my_courses' ? 'Minhas Trilhas' : 'Catálogo de Jornadas'}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-primary-100 md:text-lg">
                {activeTab === 'my_courses'
                  ? 'Uma visão mais clara do seu progresso, do que retomar agora e de quais jornadas merecem sua próxima energia.'
                  : 'Escolha novas jornadas com mais contexto visual, entendimento de carga e intenção de percurso.'}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('my_courses')}
                  className={`motion-tab rounded-full px-5 py-3 text-sm font-bold ${activeTab === 'my_courses' ? 'bg-white text-primary-900' : 'bg-white/10 text-white hover:bg-white/15'}`}
                  data-active={activeTab === 'my_courses'}
                >
                  Minhas Trilhas
                </button>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`motion-tab rounded-full px-5 py-3 text-sm font-bold ${activeTab === 'catalog' ? 'bg-white text-primary-900' : 'bg-white/10 text-white hover:bg-white/15'}`}
                  data-active={activeTab === 'catalog'}
                >
                  Explorar Catálogo
                </button>
              </div>
            </div>

            <div className="motion-list grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-primary-100"><BookOpen size={16} /> jornadas ativas</div>
                <div className="mt-3 text-3xl font-serif font-bold">{myCourses.length}</div>
              </div>
              <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-primary-100"><TrendingUp size={16} /> progresso médio</div>
                <div className="mt-3 text-3xl font-serif font-bold">{averageProgress}%</div>
              </div>
              <div className="motion-card rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-primary-100"><Target size={16} /> agora</div>
                <div className="mt-3 text-lg font-bold">{nextCourse ? nextCourse.title : 'Escolha sua primeira jornada'}</div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-600" size={48} />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>
        ) : (
          <>
            {activeTab === 'my_courses' && nextCourse && (
              <section className="motion-list mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="soft-card motion-card overflow-hidden rounded-[30px]">
                  <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative min-h-[260px]">
                      <CourseThumbnail src={nextCourse.thumbnail} alt={nextCourse.title} fill className="object-cover" />
                    </div>
                    <div className="p-7">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Retomar agora</p>
                      <h2 className="mt-3 text-3xl font-bold text-stone-900">{nextCourse.title}</h2>
                      <p className="mt-4 text-sm leading-7 text-stone-600">{nextCourse.description}</p>

                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
                          <span>Progresso</span>
                          <span>{nextCourse.progress}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-primary-100">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#5fbb85,#247a52)]" style={{ width: `${nextCourse.progress}%` }} />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-600">
                        <span className="rounded-full bg-primary-50 px-3 py-1.5 font-semibold text-primary-800">{nextCourse.level}</span>
                        <span className="rounded-full bg-stone-100 px-3 py-1.5 font-semibold">{nextCourse.totalModules} módulos</span>
                        <span className="rounded-full bg-stone-100 px-3 py-1.5 font-semibold">{formatDuration(nextCourse.durationMinutes)}</span>
                      </div>

                      <Link
                        href={`/trilhas/${nextCourse.id}/aula`}
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary-700 px-6 py-3 font-bold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800"
                      >
                        Continuar jornada <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="motion-list grid gap-4">
                  <div className="soft-card motion-card rounded-[30px] p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Seu ritmo</p>
                    <h3 className="mt-3 text-2xl font-bold text-stone-900">Clareza sobre o que já avançou</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">
                      A nova visualização destaca retomada, progresso e duração para ajudar você a entrar na trilha certa com menos esforço cognitivo.
                    </p>
                  </div>
                  <div className="soft-card motion-card rounded-[30px] p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Acesso rápido</p>
                    <div className="mt-4 grid gap-3">
                      <Link href="/eventos" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-primary-50">Ver eventos ao vivo</Link>
                      <Link href="/forum" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-primary-50">Entrar na comunidade</Link>
                      <button onClick={() => setActiveTab('catalog')} className="rounded-2xl bg-primary-50 px-4 py-3 text-left text-sm font-semibold text-primary-800 hover:bg-primary-100">
                        Descobrir novas jornadas
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-8">
              {displayedCourses.length > 0 ? (
                <div className="motion-list grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {displayedCourses.map((course) => (
                    <article key={course.id} className="soft-card motion-card overflow-hidden rounded-[30px] transition hover:-translate-y-1">
                      <div className="relative h-52">
                        <CourseThumbnail
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                          <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-800 backdrop-blur">
                            {course.level}
                          </span>
                          {activeTab === 'catalog' && course.price > 0 ? (
                            <span className="rounded-full bg-primary-700 px-3 py-1 text-xs font-bold text-white shadow-lg">
                              R$ {course.price.toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                            <BookOpen size={13} /> {course.totalModules} módulos
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1">
                            <Clock3 size={13} /> {formatDuration(course.durationMinutes)}
                          </span>
                        </div>

                        <h3 className="text-2xl font-bold leading-tight text-stone-900">{course.title}</h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-stone-600">{course.description}</p>

                        {course.isEnrolled ? (
                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-700">
                              <span>Avanço</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-primary-100">
                              <div className="h-full rounded-full bg-[linear-gradient(90deg,#5fbb85,#247a52)]" style={{ width: `${course.progress}%` }} />
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-3">
                          {course.isEnrolled ? (
                            <Link
                              href={`/trilhas/${course.id}/aula`}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800"
                            >
                              {course.progress > 0 ? 'Continuar trilha' : 'Começar trilha'} <ArrowRight size={16} />
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/cursos/${course.slug}`}
                                className="inline-flex items-center justify-center rounded-full border border-primary-900/10 bg-white px-5 py-3 text-sm font-bold text-stone-700 hover:bg-primary-50"
                              >
                                Ver detalhes
                              </Link>
                              <button
                                onClick={() => handleAddToCart(course.id)}
                                disabled={checkoutLoading === course.id}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800 disabled:opacity-50"
                              >
                                {checkoutLoading === course.id ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <>
                                    <ShoppingBag size={16} />
                                    Adicionar ao carrinho
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="soft-card motion-card rounded-[30px] p-10 text-center">
                  <h3 className="text-3xl font-bold text-stone-900">
                    {activeTab === 'my_courses' ? 'Sua área ainda está vazia' : 'Nenhuma jornada publicada agora'}
                  </h3>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-600">
                    {activeTab === 'my_courses'
                      ? 'Quando você iniciar uma jornada, ela aparece aqui com progresso, retomada rápida e visual mais agradável para acompanhar sua evolução.'
                      : 'Volte em breve ou explore outras áreas da plataforma enquanto novas jornadas são publicadas.'}
                  </p>
                  {activeTab === 'my_courses' ? (
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="mt-6 rounded-full bg-primary-700 px-6 py-3 font-bold text-white hover:bg-primary-800"
                    >
                      Explorar catálogo
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
