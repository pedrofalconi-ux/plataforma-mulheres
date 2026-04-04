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
    const { secretKey } = body;

    // 3. Verify Custom Secret Key (Mestra)
    const validKey = process.env.ADMIN_SECRET_KEY;
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

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'admin' }) // matching DB enum lowercase
      .eq('id', user.id);

    if (updateError) {
      console.error('Update Error:', updateError);
      return NextResponse.json({ error: `Erro no banco: ${updateError.message}` }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Perfil promovido a Administrador com sucesso!' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
