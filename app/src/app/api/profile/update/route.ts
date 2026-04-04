import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Cliente para autenticar o usuário (usa os cookies da sessão)
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

    // 2. Verifica se o usuário está logado
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 3. Obtém os dados do corpo da requisição
    const { full_name, phone, bio, avatar_url, region_id, skills } = await request.json();

    // 4. Cliente Admin para ignorar RLS (usando Service Role Key)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 5. Realiza a atualização
    const { data: profile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name,
        phone,
        bio,
        avatar_url,
        region_id: region_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro na atualização do perfil:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar perfil no banco de dados' }, { status: 500 });
    }

    // 6. Atualiza as skills
    if (skills && Array.isArray(skills)) {
      await adminClient.from('profile_skills').delete().eq('profile_id', user.id);
      
      if (skills.length > 0) {
        const skillsToInsert = skills.map(skill_id => ({
          profile_id: user.id,
          skill_id
        }));
        await adminClient.from('profile_skills').insert(skillsToInsert);
      }
    }

    return NextResponse.json({ success: true, profile });

  } catch (error: any) {
    console.error('Erro na rota de API de perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
