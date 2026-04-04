import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/forum/[id]/replies — Adiciona resposta a um tópico
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Resposta não pode estar vazia.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('forum_replies')
    .insert({ topic_id: id, content, author_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reply: data }, { status: 201 });
}
