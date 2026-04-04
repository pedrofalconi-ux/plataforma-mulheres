import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/services/courses';
import { CoursePreview } from '@/components/courses/CoursePreview';

export const revalidate = 3600; // Cache de 1 hora para performance de Landing public

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  try {
    const course = await getCourseBySlug(resolvedParams.slug);
    if (!course) return { title: 'Curso não encontrado' };
    
    return {
      title: `${course.title} | Ecossistema da Dignidade`,
      description: course.description || 'Página de apresentação do curso.',
    };
  } catch (err) {
    return { title: 'Detalhes do Curso' };
  }
}

export default async function CourseSalesPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  try {
    const course = await getCourseBySlug(resolvedParams.slug);
    
    if (!course || !course.is_published) {
      notFound();
    }

    return (
      <main className="flex-1">
        <CoursePreview course={course} />
      </main>
    );
  } catch (error: any) {
    console.error('Error fetching course for preview:', error);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-lg">
          <h2 className="mb-2 text-xl font-bold text-red-700">Erro ao carregar detalhes</h2>
          <p className="text-sm text-red-600 mb-4">{error.message || 'Erro desconhecido'}</p>
          <a href="/trilhas" className="text-primary-600 hover:underline">Voltar para Trilhas</a>
        </div>
      </div>
    );
  }
}
