import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ensureProfileEnrolledInAllCourses } from '@/lib/universal-enrollment';

export async function POST(request: Request) {
  try {
    const { userId, fullName, email } = await request.json();

    if (!userId || !fullName || !email) {
      return NextResponse.json({ error: 'Dados obrigatorios ausentes' }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authUserError,
    } = await adminClient.auth.admin.getUserById(userId);

    if (authUserError) {
      return NextResponse.json({ error: authUserError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario ainda nao existe em auth.users. Tente novamente em instantes.' },
        { status: 409 },
      );
    }

    const { data: existing, error: existingError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      const needsUpdate = existing.full_name !== fullName || existing.email !== email;

      if (!needsUpdate) {
        return NextResponse.json(existing);
      }

      const { data: updated, error: updateError } = await adminClient
        .from('profiles')
        .update({
          full_name: fullName,
          email,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      await ensureProfileEnrolledInAllCourses(adminClient, userId);
      return NextResponse.json(updated);
    }

    const { data, error } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email,
        role: 'student',
      })
      .select()
      .single();

    if (error) throw error;
    await ensureProfileEnrolledInAllCourses(adminClient, userId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
