import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // 1. Verify Authentication (Current User)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para virar administrador.' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const secretKey = String(body?.secretKey || '').trim();

    // 3. Verify Custom Secret Key (Mestra)
    const validKey = String(process.env.ADMIN_SECRET_KEY || '').trim();
    if (!validKey || secretKey !== validKey) {
      return NextResponse.json({ error: 'Chave de segurança mestra inválida.' }, { status: 403 });
    }

    // 4. Upgrade Role using SERVICE ROLE (Bypassing RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'Erro de configuração no servidor (Chave de Serviço ausente).' }, { status: 500 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    const { error: profileUpsertError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || 'Administradora',
          email: user.email || '',
          role: 'student',
        },
        { onConflict: 'id' }
      );

    if (profileUpsertError) {
      console.error('Profile Upsert Error:', profileUpsertError);
      return NextResponse.json({ error: `Erro ao preparar perfil: ${profileUpsertError.message}` }, { status: 500 });
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'admin' }) // matching DB enum lowercase
      .eq('id', user.id)
      .select('id, role')
      .single();

    if (updateError) {
      console.error('Update Error:', updateError);
      return NextResponse.json({ error: `Erro no banco: ${updateError.message}` }, { status: 403 });
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Perfil nao encontrado para promover a administrador.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Perfil promovido a Administrador com sucesso!' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
