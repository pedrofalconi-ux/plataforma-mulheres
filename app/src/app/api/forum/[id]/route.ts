import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/forum/[id] — Retorna um tópico com suas respostas
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Incrementar view_count
  await supabase.rpc('increment_forum_view', { topic_id: id });

  const { data: topic, error } = await supabase
    .from('forum_topics')
    .select(`
      *,
      profiles:author_id (full_name, display_name, avatar_url),
      forum_replies (
        id,
        content,
        created_at,
        profiles:author_id (full_name, display_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ topic });
}
