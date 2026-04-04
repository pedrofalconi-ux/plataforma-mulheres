'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock3, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EditorialButtonLink, EditorialPanel, PageSection, SectionIntro } from '@/components/brand/Editorial';

type LearningCourse = {
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

function CourseThumbnail({
  src,
  alt,
  fill,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
}) {
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

function formatDuration(durationMinutes: number) {
  if (!durationMinutes) return 'Ritmo livre';
  const hours = Math.floor(durationMinutes / 60);
  if (hours === 0) return `${durationMinutes} min`;
  return `${hours}h${durationMinutes % 60 ? ` ${durationMinutes % 60}min` : ''}`;
}

function ProgressLine({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-900/45">
        <span>Progresso</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 border border-primary-900/10 bg-primary-50 p-[2px]">
        <div className="h-full bg-primary-900" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function FeaturedCourse({ course }: { course: LearningCourse }) {
  return (
    <div className="grid gap-8 border border-primary-900/12 bg-white lg:grid-cols-[0.95fr_1.05fr]">
      <div className="relative min-h-[360px] overflow-hidden">
        <CourseThumbnail src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
      <div className="flex flex-col justify-between p-8 lg:p-10">
        <div>
          <p className="editorial-kicker">{course.level}</p>
          <h3 className="mt-4 text-5xl leading-none text-primary-900">{course.title}</h3>
          <p className="mt-5 max-w-2xl text-base leading-8 text-primary-900/72">{course.description}</p>
        </div>

        <div className="mt-8 space-y-6">
          <ProgressLine progress={course.progress} />
          <div className="flex flex-wrap gap-4 border-t border-primary-900/10 pt-5 text-sm text-primary-900/68">
            <span>{course.totalModules || 0} modulos</span>
            <span>{formatDuration(course.durationMinutes)}</span>
          </div>
          <EditorialButtonLink href={`/trilhas/${course.id}/aula`} className="w-full sm:w-auto">
            Continuar aprendizado <ArrowRight size={18} />
          </EditorialButtonLink>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: LearningCourse }) {
  const href = course.isEnrolled ? `/trilhas/${course.id}/aula` : `/cursos/${course.slug}`;

  return (
    <Link href={href} className="group block border border-primary-900/10 bg-white transition-colors hover:border-primary-900/30">
      <div className="relative h-56 overflow-hidden border-b border-primary-900/10">
        <CourseThumbnail src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="(min-width: 768px) 33vw, 100vw" />
      </div>
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="editorial-kicker">{course.isEnrolled ? 'Em andamento' : 'Disponivel'}</p>
            <h3 className="mt-3 text-3xl leading-none text-primary-900">{course.title}</h3>
          </div>
          <span className="border border-primary-900/10 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-900/65">
            {course.level}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-primary-900/72">{course.description}</p>

        {course.isEnrolled ? <ProgressLine progress={course.progress} /> : null}

        <div className="flex items-center justify-between border-t border-primary-900/10 pt-4 text-sm text-primary-900/68">
          <span>{course.totalModules || 0} modulos</span>
          <span>{course.price > 0 ? `R$ ${course.price.toFixed(2).replace('.', ',')}` : 'Acesso incluso'}</span>
        </div>
      </div>
    </Link>
  );
}

export function LearningHub() {
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
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

        const mappedCourses: LearningCourse[] = (coursesData || []).map((course: any) => {
          const enrollment = enrollmentsData.find((item) => item.course_id === course.id);

          return {
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description || 'Instrucoes para sua jornada.',
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
        setError('Nao foi possivel carregar suas trilhas agora.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [supabase, user]);

  const myCourses = courses.filter((course) => course.isEnrolled);
  const activeCourse = myCourses.find((course) => course.progress > 0 && course.progress < 100) || myCourses[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#f7f1ec]">
        <Loader2 className="animate-spin text-primary-700" size={40} />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PageSection className="pt-12">
        <SectionIntro
          eyebrow="Aprendizado"
          title="Uma area mais limpa para acompanhar o que voce estuda."
          description="Sem visual inflado, sem blocos artificiais. Apenas o que importa: continuar, revisar e escolher a proxima trilha."
        />

        {error ? (
          <EditorialPanel className="mt-10 border-red-200 bg-red-50 text-red-700">
            {error}
          </EditorialPanel>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-10">
            {activeCourse ? (
              <FeaturedCourse course={activeCourse} />
            ) : (
              <EditorialPanel className="p-10">
                <p className="editorial-kicker">Sua proxima etapa</p>
                <h3 className="mt-4 text-4xl leading-none text-primary-900">Seu aprendizado ainda nao comecou.</h3>
                <p className="mt-5 max-w-2xl text-base leading-8 text-primary-900/72">
                  Explore as trilhas disponiveis e comece com um caminho que faca sentido para o momento da sua casa e da sua rotina.
                </p>
                <EditorialButtonLink href="/blog" className="mt-8 w-full sm:w-auto">
                  Ver materiais da casa
                </EditorialButtonLink>
              </EditorialPanel>
            )}

            <div className="space-y-6">
              <div className="editorial-rule" />
              <SectionIntro
                eyebrow="Biblioteca"
                title="Todas as trilhas publicadas em um unico lugar."
                description="Se voce ja esta inscrita, continue de onde parou. Se ainda nao entrou, use essa pagina para explorar com calma."
              />
            </div>
          </div>

          <EditorialPanel className="flex h-full flex-col justify-between bg-primary-900 p-8 text-white">
            <div>
              <p className="editorial-kicker !text-white/58">Resumo</p>
              <h3 className="mt-4 text-4xl leading-none text-white">Seu ritmo de estudo agora.</h3>
              <div className="mt-10 space-y-6 border-t border-white/12 pt-6">
                <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-white/72">
                  <span>Trilhas iniciadas</span>
                  <span>{myCourses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-white/72">
                  <span>Disponiveis</span>
                  <span>{courses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm uppercase tracking-[0.18em] text-white/72">
                  <span>Em andamento</span>
                  <span>{myCourses.filter((course) => course.progress > 0 && course.progress < 100).length}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/12 pt-6">
              <div className="flex items-center gap-3 text-white/75">
                <Clock3 size={18} />
                <p className="text-sm leading-7">
                  A comunidade continua disponivel em paralelo, mas o foco desta area agora e o seu aprendizado.
                </p>
              </div>
              <Link href="/forum" className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white">
                Ir para a comunidade <ArrowRight size={16} />
              </Link>
            </div>
          </EditorialPanel>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </PageSection>
    </div>
  );
}
