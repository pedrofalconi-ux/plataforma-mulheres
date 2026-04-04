import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Newspaper } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Conteúdos | Dignare',
  description: 'Artigos, reflexões e atualizações editoriais da Dignare.',
};

async function getPublishedPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select(
      `
        id,
        title,
        slug,
        summary,
        image_url,
        source,
        status,
        published_at,
        scheduled_for,
        created_at,
        categories(name)
      `,
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const now = Date.now();
  return (data || []).filter((post: any) => {
    if (!post.scheduled_for) return true;
    return new Date(post.scheduled_for).getTime() <= now;
  });
}

function formatDate(date?: string | null) {
  if (!date) return 'Sem data';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="hero-sheen rounded-[36px] p-8 text-white shadow-[0_28px_90px_rgba(22,63,46,0.18)] md:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-100">
            <Newspaper size={24} />
          </div>
          <h1 className="mt-4 text-5xl font-bold">Conteúdos da Dignare</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-primary-100">
            Uma camada editorial mais limpa para reunir reflexões, notícias, textos de formação e movimentos da comunidade.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="soft-card mt-8 rounded-[30px] p-10 text-center text-stone-600">
            Nenhuma publicação disponível no momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post: any) => (
              <article key={post.id} className="soft-card overflow-hidden rounded-[30px] transition hover:-translate-y-1">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative h-48 bg-stone-100">
                    {post.image_url ? (
                      <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400">
                        <Newspaper size={36} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-stone-500">
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 font-bold text-primary-700">
                        {(post.categories as any)?.name || post.source || 'Editorial'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900">{post.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                      {post.summary || 'Leia o conteúdo completo deste artigo na Dignare.'}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-bold text-primary-700 hover:text-primary-800">
                      Ler artigo completo
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
