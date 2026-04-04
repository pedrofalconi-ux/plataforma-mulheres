import { createClient } from '@/lib/supabase/server';
import { type Course } from '@/lib/schemas';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function getCourses(publishedOnly = true) {
  const supabase = await createClient();
  let query = supabase
    .from('courses')
    .select('*, categories(name, slug)')
    .order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCourseBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      categories(name, slug),
      modules(
        *,
        lessons(
          *,
          materials(*)
        )
      )
    `)
    .eq('slug', slug)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single();

  if (error) throw error;
  return data;
}

export async function getCourseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      categories(name, slug),
      modules(
        *,
        lessons(
          *,
          materials(*)
        )
      )
    `)
    .eq('id', id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single();

  if (error) throw error;
  return data;
}

export async function createCourse(courseData: Omit<Course, 'id'> | Omit<Course, 'id' | 'slug'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const slug = 'slug' in courseData && courseData.slug
    ? courseData.slug
    : `${slugify(courseData.title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from('courses')
    .insert({ ...courseData, slug, created_by: user?.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}
