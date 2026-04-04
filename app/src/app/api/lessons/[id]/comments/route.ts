import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PostCommentSchema = z.object({
  content: z.string().min(1, 'O comentário não pode ser vazio.'),
  parentId: z.string().regex(uuidRegex, 'ID inválido').optional(),
});

// GET: Busca os comentários da aula
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: lessonId } = await params;

    if (!lessonId) return NextResponse.json({ error: 'Lesson ID não fornecido' }, { status: 400 });

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

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    console.error('[GET comments] crash:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST: Cria um novo comentário ou resposta
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });

    const resolvedParams = await params;
    const lessonId = resolvedParams.id;
    const body = await req.json();
    const { content, parentId } = PostCommentSchema.parse(body);

    const { data, error } = await supabase
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        profile_id: profile.id,
        content,
        parent_id: parentId || null
      })
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
