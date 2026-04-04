'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Loader2, MessageSquareQuote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EditorialButtonLink, EditorialPanel, PageSection, SectionIntro } from '@/components/brand/Editorial';

type LearningCourse = {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail: string;
  totalModules: number;
  durationMinutes: number;
};

type FeaturedBlock = {
  id: string;
  title: string;
  description: string;
  href: string;
  thumbnail: string;
  eyebrow: string;
  icon: React.ReactNode;
  meta: string;
};

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80';

const DEFAULT_BLOCKS = [
  {
    key: 'aprendizado',
    title: 'Aprendizado',
    eyebrow: 'Bloco principal',
    description:
      'Use este bloco para reunir modulos, aulas e materiais em PDF que todas as alunas devem acessar.',
    icon: <BookOpen size={18} />,
  },
  {
    key: 'testemunho',
    title: 'Testemunhos',
    eyebrow: 'Bloco complementar',
    description:
      'Use este bloco para organizar relatos, experiencias e aulas de apoio que reforcem a jornada da comunidade.',
    icon: <MessageSquareQuote size={18} />,
  },
] as const;

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

function buildFeaturedBlocks(courses: LearningCourse[]): FeaturedBlock[] {
  const usedIds = new Set<string>();

  const picked = DEFAULT_BLOCKS.map((block) => {
    const match = courses.find((course) => {
      const normalized = `${course.title} ${course.description}`.toLowerCase();
      return normalized.includes(block.key);
    });

    if (!match) {
      return {
        id: block.key,
        title: block.title,
        description: block.description,
        href: '/admin/cursos',
        thumbnail: FALLBACK_THUMBNAIL,
        eyebrow: block.eyebrow,
        icon: block.icon,
        meta: 'Crie este bloco no admin para publicar aulas e materiais.',
      };
    }

    usedIds.add(match.id);

    return {
      id: match.id,
      title: match.title,
      description: match.description || block.description,
      href: `/trilhas/${match.id}`,
      thumbnail: match.thumbnail,
      eyebrow: block.eyebrow,
      icon: block.icon,
      meta: `${match.totalModules || 0} modulos • ${formatDuration(match.durationMinutes)}`,
    };
  });

  const fallbackCourses = courses
    .filter((course) => !usedIds.has(course.id))
    .slice(0, 2 - picked.filter((item) => item.href !== '/admin/cursos').length);

  fallbackCourses.forEach((course) => {
    const firstPlaceholderIndex = picked.findIndex((item) => item.href === '/admin/cursos');
    if (firstPlaceholderIndex >= 0) {
      picked[firstPlaceholderIndex] = {
        id: course.id,
        title: course.title,
        description: course.description,
        href: `/trilhas/${course.id}`,
        thumbnail: course.thumbnail,
        eyebrow: picked[firstPlaceholderIndex].eyebrow,
        icon: picked[firstPlaceholderIndex].icon,
        meta: `${course.totalModules || 0} modulos • ${formatDuration(course.durationMinutes)}`,
      };
      usedIds.add(course.id);
    }
  });

  return picked;
}

function FeaturedLearningBlock({ block }: { block: FeaturedBlock }) {
  return (
    <Link
      href={block.href}
      className="group grid min-h-[360px] overflow-hidden border border-primary-900/12 bg-white transition-colors hover:border-primary-900/30 lg:grid-cols-[0.92fr_1.08fr]"
    >
      <div className="relative min-h-[250px] overflow-hidden border-b border-primary-900/10 lg:min-h-full lg:border-b-0 lg:border-r">
        <CourseThumbnail
          src={block.thumbnail}
          alt={block.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(min-width: 1024px) 38vw, 100vw"
        />
      </div>
      <div className="flex flex-col justify-between p-8 lg:p-10">
        <div>
          <div className="flex items-center gap-3 text-primary-900/60">
            {block.icon}
            <p className="editorial-kicker">{block.eyebrow}</p>
          </div>
          <h3 className="mt-4 text-5xl leading-none text-primary-900">{block.title}</h3>
          <p className="mt-5 max-w-2xl text-base leading-8 text-primary-900/72">{block.description}</p>
        </div>

        <div className="mt-8 border-t border-primary-900/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm uppercase tracking-[0.18em] text-primary-900/56">{block.meta}</span>
            <span className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-primary-900">
              Abrir bloco <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CourseCard({ course }: { course: LearningCourse }) {
  return (
    <Link
      href={`/trilhas/${course.id}`}
      className="group block border border-primary-900/10 bg-white transition-colors hover:border-primary-900/30"
    >
      <div className="relative h-56 overflow-hidden border-b border-primary-900/10">
        <CourseThumbnail
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
      </div>
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="editorial-kicker">Bloco publicado</p>
            <h3 className="mt-3 text-3xl leading-none text-primary-900">{course.title}</h3>
          </div>
          <span className="border border-primary-900/10 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-900/65">
            {course.level}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-primary-900/72">{course.description}</p>

        <div className="flex items-center justify-between border-t border-primary-900/10 pt-4 text-sm text-primary-900/68">
          <span>{course.totalModules || 0} modulos</span>
          <span>{formatDuration(course.durationMinutes)}</span>
        </div>
      </div>
    </Link>
  );
}

export function LearningHub() {
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: true });

        if (coursesError) throw coursesError;

        const mappedCourses: LearningCourse[] = (data || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description || 'Bloco pronto para receber aulas, PDFs e materiais da jornada.',
          level: course.level || 'Essencial',
          thumbnail: course.thumbnail_url || FALLBACK_THUMBNAIL,
          totalModules: course.total_modules || 0,
          durationMinutes: Number(course.duration_minutes) || 0,
        }));

        setCourses(mappedCourses);
      } catch (err) {
        console.error('Fetch Error:', err);
        setError('Nao foi possivel carregar os blocos de aprendizado agora.');
      } finally {
        setLoading(false);
      }
    }

    void fetchCourses();
  }, [supabase]);

  const featuredBlocks = useMemo(() => buildFeaturedBlocks(courses), [courses]);
  const featuredIds = new Set(
    featuredBlocks.filter((block) => block.href !== '/admin/cursos').map((block) => block.id),
  );
  const extraCourses = courses.filter((course) => !featuredIds.has(course.id));

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
          title="Os blocos publicados ficam liberados para todas as alunas."
          description="Aqui nao existe mais etapa de matricula individual. As duas frentes principais da plataforma podem viver em blocos como Aprendizado e Testemunhos, enquanto o admin continua livre para criar novos blocos, modulos, aulas e materiais."
        />

        {error ? (
          <EditorialPanel className="mt-10 border-red-200 bg-red-50 text-red-700">
            {error}
          </EditorialPanel>
        ) : null}

        <div className="mt-12 grid gap-8 xl:grid-cols-2">
          {featuredBlocks.map((block) => (
            <FeaturedLearningBlock key={block.id} block={block} />
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <EditorialPanel className="bg-primary-900 p-8 text-white">
            <p className="editorial-kicker !text-white/58">Como editar</p>
            <h3 className="mt-4 text-4xl leading-none text-white">
              O admin continua montando tudo pela area de trilhas.
            </h3>
            <div className="mt-8 space-y-4 border-t border-white/12 pt-6 text-sm leading-7 text-white/78">
              <p>
                Use um bloco para Aprendizado, outro para Testemunhos e mantenha blocos extras quando
                precisar abrir uma nova frente.
              </p>
              <p>
                Dentro de cada bloco, o admin pode criar modulos, adicionar aulas, anexar PDFs e
                organizar os materiais do jeito que fizer sentido para a plataforma.
              </p>
            </div>
            <EditorialButtonLink
              href="/admin/cursos"
              className="mt-8 w-full border-white/18 bg-white text-primary-900 hover:bg-primary-50 sm:w-auto"
            >
              Gerenciar blocos
            </EditorialButtonLink>
          </EditorialPanel>

          <div className="space-y-6">
            <div className="editorial-rule" />
            <SectionIntro
              eyebrow="Biblioteca completa"
              title="Todos os blocos extras continuam disponiveis abaixo."
              description="Se voce publicar mais de dois blocos, eles aparecem aqui como extensoes naturais da experiencia principal."
            />
          </div>
        </div>

        {extraCourses.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {extraCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EditorialPanel className="mt-12 p-10">
            <p className="editorial-kicker">Blocos extras</p>
            <h3 className="mt-4 text-4xl leading-none text-primary-900">
              Aprendizado principal organizado.
            </h3>
            <p className="mt-5 max-w-2xl text-base leading-8 text-primary-900/72">
              Quando o admin publicar novos blocos alem dos dois blocos-base, eles passam a aparecer
              aqui automaticamente.
            </p>
          </EditorialPanel>
        )}
      </PageSection>
    </div>
  );
}
