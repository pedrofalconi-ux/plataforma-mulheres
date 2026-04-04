import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/forum — Lista todos os tópicos
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forum_topics')
    .select(`
      id,
      title,
      category,
      created_at,
      view_count,
      profiles:author_id (full_name, display_name),
      reply_count:forum_replies(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ topics: data });
}

// POST /api/forum — Cria novo tópico
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await req.json();
  const { title, category, content } = body;

  if (!title || !category || !content) {
    return NextResponse.json({ error: 'Título, categoria e conteúdo são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('forum_topics')
    .insert({ title, category, content, author_id: user.id, view_count: 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ topic: data }, { status: 201 });
}
