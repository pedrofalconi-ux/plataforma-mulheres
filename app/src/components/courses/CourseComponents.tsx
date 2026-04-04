'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Loader2, Sparkles } from 'lucide-react';
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

const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Maria Silva',
    text: 'A ordem no meu lar transformou não só a rotina, mas a paz da minha família. Sou outra mulher depois dessa jornada.',
    role: 'Aluna da Comunidade'
  },
  {
    id: 't2',
    name: 'Ana Oliveira',
    text: 'Educar com intencionalidade me deu as ferramentas que eu buscava há anos. Nathi tem uma profundidade rara.',
    role: 'Mãe de 3 filhos'
  },
  {
    id: 't3',
    name: 'Julia Santos',
    text: 'O equilíbrio entre vocação e lar ficou muito mais claro para mim. Recomendo a todas as minhas amigas.',
    role: 'Empreendedora'
  }
];

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
          .eq('is_published', true);

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
            description: course.description || 'Instruções para sua jornada.',
            level: course.level || 'Essencial',
            thumbnail: course.thumbnail_url || FALLBACK_THUMBNAIL,
            progress: enrollment?.progress_percent || 0,
            totalModules: course.total_modules || 0,
            isEnrolled: !!enrollment,
            price: Number(course.price) || 0,
            durationMinutes: Number(course.duration_minutes) || 0,
          };
        });

        setCourses(mappedCourses);
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError('Não foi possível carregar suas trilhas agora.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [supabase]);

  const myCourses = courses.filter((course) => course.isEnrolled);
  const activeCourse = myCourses.find(c => c.progress > 0 && c.progress < 100) || myCourses[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#F7F2ED]">
        <Loader2 className="animate-spin text-[#DBA1A2]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2ED] pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <header className="mb-20 text-center lg:text-left transition-all">
          <span className="text-[#DBA1A2] text-sm font-bold tracking-[0.2em] uppercase">Seu Atelier Digital</span>
          <h1 className="mt-4 font-serif text-5xl font-medium text-[#422523] md:text-6xl tracking-tight">
            Minhas Trilhas
          </h1>
          <p className="mt-6 text-[#422523]/60 max-w-2xl text-lg leading-relaxed font-light">
            Bem-vinda ao seu espaço de evolução. Continue sua jornada de autoconhecimento e virtude com calma e foco absoluto.
          </p>
          <div className="mt-8 h-1 w-24 bg-[#DBA1A2] rounded-full mx-auto lg:mx-0 opacity-40" />
        </header>

        <div className="grid gap-20 lg:grid-cols-[0.8fr_1.2fr] items-start">
          {/* Block A: Testimonials / Community (Editorial Style) */}
          <aside className="space-y-12">
            <div className="flex items-center gap-4 border-b border-[#E7D8D8] pb-6">
              <Sparkles className="text-[#DBA1A2]" size={28} />
              <h2 className="font-serif text-3xl font-medium text-[#422523]">Comunidade</h2>
            </div>
            
            <div className="space-y-10">
              {TESTIMONIALS.map((t, idx) => (
                <div key={t.id} className="group relative">
                  <div className="bg-white p-8 rounded-[36px] border border-[#E7D8D8] shadow-[0_10px_40px_rgba(66,37,35,0.03)] group-hover:shadow-[0_20px_60px_rgba(66,37,35,0.08)] transition-all duration-700 hover:-translate-y-1">
                    <p className="font-serif italic text-[#422523] leading-relaxed text-base">
                      &quot;{t.text}&quot;
                    </p>
                    <div className="mt-6 pt-6 border-t border-[#F7F2ED] flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#Vanilla Ice] border border-[#DBA1A2]/20 flex items-center justify-center text-[#DBA1A2] font-bold text-xs">
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#422523]">{t.name}</span>
                        <span className="text-[10px] text-[#DBA1A2] uppercase tracking-widest font-black mt-0.5">{t.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
               <Link href="/forum" className="group flex items-center gap-3 text-xs font-black tracking-widest text-[#422523] hover:text-[#DBA1A2] transition-colors">
                  EXPLORAR COMUNIDADE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </aside>

          {/* Block B: Course Journey (Education Focused) */}
          <main className="space-y-12">
            <div className="flex items-center gap-4 border-b border-[#E7D8D8] pb-6">
              <BookOpen className="text-[#DBA1A2]" size={28} />
              <h2 className="font-serif text-3xl font-medium text-[#422523]">Continuar Assistindo</h2>
            </div>

            {activeCourse ? (
              <div className="group relative bg-white rounded-[48px] border border-[#E7D8D8] overflow-hidden shadow-[0_30px_90px_rgba(66,37,35,0.06)] hover:shadow-[0_40px_110px_rgba(66,37,35,0.12)] transition-all duration-700">
                <div className="grid md:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative h-64 md:h-full min-h-[400px] overflow-hidden">
                    <CourseThumbnail 
                      src={activeCourse.thumbnail} 
                      alt={activeCourse.title} 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#422523]/20 to-transparent" />
                  </div>
                  
                  <div className="p-10 md:p-14 flex flex-col justify-center bg-white relative">
                    <div className="absolute top-10 right-10">
                      <div className="h-12 w-12 rounded-full border-4 border-[#F7F2ED] border-t-[#DBA1A2] animate-[spin_3s_linear_infinite]" />
                    </div>

                    <span className="px-4 py-1.5 bg-[#F7F2ED] text-[#DBA1A2] text-[11px] font-black tracking-[0.2em] uppercase rounded-full w-fit">
                      {activeCourse.level}
                    </span>
                    
                    <h3 className="mt-8 font-serif text-4xl font-medium text-[#422523] leading-tight group-hover:text-black transition-colors">
                      {activeCourse.title}
                    </h3>
                    
                    <p className="mt-6 text-[#422523]/60 text-base leading-relaxed line-clamp-3 font-light">
                      {activeCourse.description}
                    </p>

                    <div className="mt-10 space-y-5">
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-[#422523]/30 uppercase tracking-[0.2em]">Progresso na Trilha</span>
                        <span className="text-lg font-serif font-bold text-[#422523]">{activeCourse.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#F7F2ED] rounded-full overflow-hidden p-0.5 border border-[#E7D8D8]">
                        <div 
                          className="h-full bg-gradient-to-r from-[#DBA1A2] to-[#E7D8D8] rounded-full transition-all duration-1500 ease-in-out" 
                          style={{ width: `${activeCourse.progress}%` }} 
                        />
                      </div>
                    </div>

                    <Link
                      href={`/trilhas/${activeCourse.id}/aula`}
                      className="mt-12 inline-flex items-center justify-center gap-4 bg-[#422523] hover:bg-[#2C1917] text-white py-5 px-10 rounded-[24px] font-bold text-lg transition-all active:scale-[0.97] shadow-2xl shadow-[#422523]/30 group-hover:-translate-y-1"
                    >
                      Continuar Jornada <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 text-center rounded-[56px] border border-[#E7D8D8] border-dashed shadow-sm">
                <div className="mx-auto w-24 h-24 bg-[#F7F2ED] rounded-full flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <BookOpen className="text-[#DBA1A2]" size={40} />
                </div>
                <h3 className="font-serif text-3xl font-medium text-[#422523]">Sua jornada ainda não começou</h3>
                <p className="mt-6 text-[#422523]/50 max-w-sm mx-auto text-lg leading-relaxed font-light">
                  Explore nossas trilhas de formação e comece a transformar o seu legado hoje mesmo.
                </p>
                <Link
                  href="/trilhas"
                  className="mt-12 inline-flex items-center gap-3 bg-[#DBA1A2] hover:bg-[#D48F90] px-12 py-6 rounded-[24px] font-bold text-white shadow-2xl shadow-[#DBA1A2]/20 transition-all text-lg"
                >
                  Conhecer Coleções <ArrowRight size={22} />
                </Link>
              </div>
            )}

            {myCourses.length > 1 && (
              <div className="mt-20 space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#422523]/30">Suas Coleções</h3>
                  <div className="h-px flex-1 bg-[#E7D8D8] ml-10 opacity-50" />
                </div>
                
                <div className="grid gap-8 sm:grid-cols-2">
                  {myCourses.filter(c => c.id !== activeCourse?.id).map(course => (
                    <Link 
                      key={course.id} 
                      href={`/trilhas/${course.id}/aula`} 
                      className="group bg-white flex items-center gap-6 p-6 rounded-[36px] border border-[#E7D8D8] hover:border-[#DBA1A2] transition-all hover:shadow-[0_20px_50px_rgba(66,37,35,0.05)]"
                    >
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-[20px] bg-[#F7F2ED]">
                        <CourseThumbnail src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-serif text-xl font-medium text-[#422523] group-hover:text-[#DBA1A2] transition-colors">
                          {course.title}
                        </h4>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-[#F7F2ED] rounded-full overflow-hidden">
                            <div className="h-full bg-[#DBA1A2]/40 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-[#422523]/40 tracking-wider text-right">{course.progress}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
