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
        <header className="mb-16">
          <span className="text-[#DBA1A2] text-sm font-bold tracking-widest uppercase ml-1">Sua Área</span>
          <h1 className="mt-2 font-serif text-4xl font-medium text-[#422523] md:text-5xl">Minhas Trilhas</h1>
          <div className="mt-6 h-1 w-20 bg-[#DBA1A2] rounded-full" />
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
          {/* Block A: Testimonials / Community (Social Proof/Belonging) */}
          <aside className="space-y-10">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#DBA1A2]" size={24} />
              <h2 className="font-serif text-2xl font-medium text-[#422523]">Comunidade</h2>
            </div>
            
            <div className="space-y-8 relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E7D8D8]" />
              
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="relative pl-12 group">
                  <div className="absolute left-[19px] top-2 h-3 w-3 rounded-full bg-[#E7D8D8] border-2 border-[#F7F2ED] z-10 group-hover:bg-[#DBA1A2] transition-colors" />
                  <div className="bg-white p-6 rounded-[24px] border border-[#E7D8D8] shadow-sm group-hover:shadow-md transition-all">
                    <p className="font-serif italic text-[#422523]/80 leading-relaxed text-sm">
                      &quot;{t.text}&quot;
                    </p>
                    <div className="mt-4 border-t border-[#F7F2ED] pt-4 flex flex-col">
                      <span className="text-sm font-bold text-[#422523]">{t.name}</span>
                      <span className="text-[10px] text-[#DBA1A2] uppercase tracking-widest font-bold mt-1">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pl-12">
               <Link href="/forum" className="group flex items-center gap-2 text-xs font-bold text-[#422523]/60 hover:text-[#DBA1A2] transition-colors">
                  VER TODAS AS HISTÓRIAS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </aside>

          {/* Block B: Course Journey (Education) */}
          <main className="space-y-10">
            <div className="flex items-center gap-3">
              <BookOpen className="text-[#DBA1A2]" size={24} />
              <h2 className="font-serif text-2xl font-medium text-[#422523]">Sua Jornada Atual</h2>
            </div>

            {activeCourse ? (
              <div className="group relative bg-white rounded-[40px] border border-[#E7D8D8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="grid md:grid-cols-2">
                  <div className="relative h-64 md:h-full min-h-[320px] overflow-hidden">
                    <CourseThumbnail 
                      src={activeCourse.thumbnail} 
                      alt={activeCourse.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-[#422523]/10" />
                  </div>
                  
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <span className="inline-block px-3 py-1 bg-[#F7F2ED] text-[#DBA1A2] text-[10px] font-bold tracking-widest uppercase rounded-full w-fit">
                      {activeCourse.level}
                    </span>
                    
                    <h3 className="mt-6 font-serif text-3xl font-medium text-[#422523] leading-tight">
                      {activeCourse.title}
                    </h3>
                    
                    <p className="mt-4 text-[#422523]/70 text-sm leading-relaxed line-clamp-3">
                      {activeCourse.description}
                    </p>

                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-[#422523]/40 uppercase tracking-widest">Progresso</span>
                        <span className="text-sm font-serif font-medium text-[#422523]">{activeCourse.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F7F2ED] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#DBA1A2] rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${activeCourse.progress}%` }} 
                        />
                      </div>
                    </div>

                    <Link
                      href={`/trilhas/${activeCourse.id}/aula`}
                      className="mt-10 inline-flex items-center justify-center gap-3 bg-[#422523] hover:bg-[#5D3A38] text-white py-4 px-8 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#422523]/20"
                    >
                      Continuar de onde parou <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-[40px] border border-[#E7D8D8] border-dashed">
                <div className="mx-auto w-16 h-16 bg-[#F7F2ED] rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="text-[#DBA1A2]" size={32} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-[#422523]">Sua jornada ainda não começou</h3>
                <p className="mt-4 text-[#422523]/60 max-w-xs mx-auto text-sm leading-relaxed">
                  Explore nosso catálogo e comece hoje mesmo a transformar o seu lar com intencionalidade.
                </p>
                <Link
                  href="/trilhas"
                  className="mt-8 inline-flex items-center gap-2 bg-[#DBA1A2] hover:bg-[#D48F90] px-8 py-4 rounded-2xl font-bold text-white shadow-lg shadow-[#DBA1A2]/20 transition-all border border-transparent"
                >
                  Ver Catálogo de Cursos <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {myCourses.length > 1 && (
              <div className="mt-16 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#422523]/40">Outras jornadas iniciadas</h3>
                  <div className="h-px flex-1 bg-[#E7D8D8] ml-6" />
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  {myCourses.filter(c => c.id !== activeCourse?.id).map(course => (
                    <Link 
                      key={course.id} 
                      href={`/trilhas/${course.id}/aula`} 
                      className="group bg-white flex items-center gap-5 p-5 rounded-[28px] border border-[#E7D8D8] hover:border-[#DBA1A2] transition-all hover:shadow-md"
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#F7F2ED]">
                        <CourseThumbnail src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-serif text-lg font-medium text-[#422523] group-hover:text-[#DBA1A2] transition-colors">
                          {course.title}
                        </h4>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1 bg-[#F7F2ED] rounded-full overflow-hidden">
                            <div className="h-full bg-[#DBA1A2]/60 rounded-full" style={{ width: `${course.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-[#422523]/40">{course.progress}%</span>
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
