import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select(
      `
        id,
        title,
        slug,
        summary,
        content,
        image_url,
        source,
        status,
        published_at,
        scheduled_for,
        created_at,
        categories(name),
        profiles!author_id(full_name)
      `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) return null;
  if (data.scheduled_for && new Date(data.scheduled_for).getTime() > Date.now()) return null;
  return data;
}

function formatDate(date?: string | null) {
  if (!date) return 'Sem data';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artigo não encontrado',
    };
  }

  return {
    title: `${post.title} | Dignare`,
    description: post.summary || 'Conteúdo editorial da Dignare.',
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-900/10 bg-white px-4 py-2 text-sm font-bold text-stone-600 hover:bg-primary-50 hover:text-stone-900"
        >
          <ArrowLeft size={16} />
          Voltar para conteúdos
        </Link>

        <header className="soft-card rounded-[30px] p-8">
          <div className="mb-3 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
            {(post.categories as any)?.name || post.source || 'Editorial'}
          </div>
          <h1 className="text-5xl font-bold text-stone-900">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span>Autor: {(post as any).profiles?.full_name || 'Equipe Dignare'}</span>
          </div>
          {post.summary ? <p className="mt-5 text-lg leading-8 text-stone-600">{post.summary}</p> : null}
        </header>

        {post.image_url ? (
          <div className="mt-6 overflow-hidden rounded-[30px] border border-primary-900/8 bg-white shadow-sm">
            <div className="relative h-[420px]">
              <Image src={post.image_url} alt={post.title} fill className="object-cover" />
            </div>
          </div>
        ) : null}

        <section className="soft-card mt-6 rounded-[30px] p-8">
          <div className="prose prose-stone max-w-none leading-8">
            {post.content ? (
              post.content.split('\n').map((paragraph: string, index: number) => (
                <p key={`${post.id}-paragraph-${index}`} className="text-stone-700">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-stone-600">Conteúdo em atualização.</p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
}
