'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type LearningCourse = {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail: string;
  totalModules: number;
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

function CourseCard({ course }: { course: LearningCourse }) {
  return (
    <Link
      href={`/trilhas/${course.id}/aula`}
      className="group block overflow-hidden border border-primary-900/10 bg-white transition-colors hover:border-primary-900/30"
    >
      <div className="relative h-64 overflow-hidden border-b border-primary-900/10">
        <CourseThumbnail
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
        />
      </div>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-[2.35rem] font-medium leading-[1.02] tracking-[-0.03em] text-primary-900 sm:text-[2.65rem]">
            {course.title}
          </h2>
        </div>

        <p className="line-clamp-3 max-w-[28rem] text-[1.02rem] leading-8 text-primary-900/72">
          {course.description}
        </p>

        <div className="border-t border-primary-900/10 pt-4 text-sm text-primary-900/68">
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
          description: course.description || 'Trilha pronta para receber aulas e materiais.',
          level: course.level || 'Essencial',
          thumbnail: course.thumbnail_url || FALLBACK_THUMBNAIL,
          totalModules: course.total_modules || 0,
          durationMinutes: Number(course.duration_minutes) || 0,
        }));

        setCourses(mappedCourses);
      } catch (err) {
        console.error('Fetch Error:', err);
        setError('Não foi possível carregar as trilhas agora.');
      } finally {
        setLoading(false);
      }
    }

    void fetchCourses();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#f7f1ec]">
        <Loader2 className="animate-spin text-primary-700" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-primary-900/60">
        Nenhuma trilha publicada ainda.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 pb-24">
      <div className="flex flex-wrap justify-center gap-8">
        {courses.map((course) => (
          <div key={course.id} className="w-full max-w-[400px]">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
}
