import { createClient } from '@/lib/supabase/server';
import { type BlogPost } from '@/lib/schemas';

export async function getPosts(status: string = 'published') {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, categories(name, slug), profiles!author_id(full_name, avatar_url)')
    .eq('status', status)
    .order('published_at', { ascending: false });

  if (error) throw error;
  if (status !== 'published') return data;

  const now = Date.now();
  return (data || []).filter((post: any) => {
    if (!post.scheduled_for) return true;
    return new Date(post.scheduled_for).getTime() <= now;
  });
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, categories(name, slug), profiles!author_id(full_name, avatar_url)')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

export async function createPost(postData: Omit<BlogPost, 'id'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...postData,
      author_id: user?.id,
      published_at:
        postData.status === 'published' && !postData.scheduled_for
          ? new Date().toISOString()
          : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();

  if (updates.status === 'published') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}
