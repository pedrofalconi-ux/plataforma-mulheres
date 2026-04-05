import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PostCommentSchema = z.object({
  content: z.string().trim().min(1, 'O comentario nao pode ser vazio.'),
  parentId: z.string().regex(uuidRegex, 'ID invalido').nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: lessonId } = await params;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID nao fornecido' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('lesson_comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles!lesson_comments_profile_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[GET comments] error:', error);
      throw error;
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error: unknown) {
    console.error('[GET comments] crash:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 });
    }

    const { id: lessonId } = await params;
    const body = await req.json();
    const { content, parentId } = PostCommentSchema.parse(body);

    const { data, error } = await supabase
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        profile_id: profile.id,
        content,
        parent_id: parentId ?? null,
      })
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles!lesson_comments_profile_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) {
      console.error('[POST comments] error:', error);
      throw error;
    }

    return NextResponse.json({ comment: data });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados invalidos', details: error.flatten() }, { status: 400 });
    }

    console.error('[POST comments] crash:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
