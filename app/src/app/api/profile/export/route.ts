import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseSession = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const [
      profileResult,
      skillsResult,
      enrollmentsResult,
      certificatesResult,
      forumTopicsResult,
      forumRepliesResult,
    ] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', user.id).single(),
      adminClient
        .from('profile_skills')
        .select('skill_id, skills(id, name)')
        .eq('profile_id', user.id),
      adminClient
        .from('enrollments')
        .select('*, courses(id, title, slug)')
        .eq('profile_id', user.id),
      adminClient.from('certificates').select('*').eq('profile_id', user.id),
      adminClient.from('forum_topics').select('*').eq('profile_id', user.id),
      adminClient.from('forum_replies').select('*').eq('profile_id', user.id),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profileResult.data ?? null,
      skills: skillsResult.data ?? [],
      enrollments: enrollmentsResult.data ?? [],
      certificates: certificatesResult.data ?? [],
      forum_topics: forumTopicsResult.data ?? [],
      forum_replies: forumRepliesResult.data ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="ecossistema-dados-${user.id}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao exportar dados' }, { status: 500 });
  }
}
