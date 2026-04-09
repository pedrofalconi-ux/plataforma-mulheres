import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { ensureProfileEnrolledInAllCourses } from '@/lib/universal-enrollment';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados invalidos.' },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const adminClient = await createAdminClient();

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (createUserError) {
      const message = createUserError.message.toLowerCase();

      if (
        message.includes('already been registered') ||
        message.includes('already registered') ||
        message.includes('already exists') ||
        message.includes('duplicate')
      ) {
        return NextResponse.json(
          { error: 'Ja existe uma conta com este e-mail. Tente entrar com seus dados.' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: createUserError.message }, { status: 400 });
    }

    const userId = createdUser.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Não foi possível criar a conta agora. Tente novamente.' },
        { status: 500 }
      );
    }

    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        email,
        role: 'student',
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await ensureProfileEnrolledInAllCourses(adminClient, userId);

    return NextResponse.json({
      success: true,
      userId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Não foi possível criar a conta agora.' },
      { status: 500 }
    );
  }
}
