import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, fullName, email } = await request.json();

    if (!userId || !fullName || !email) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verifica se perfil já existe
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Perfil já existe' });
    }

    const { data, error } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email: email,
        role: 'student',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
