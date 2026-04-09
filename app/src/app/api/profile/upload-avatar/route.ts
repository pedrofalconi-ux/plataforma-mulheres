import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BUCKET_NAME = 'platform-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function getExtension(fileName: string, mimeType: string) {
  const extensionFromName = fileName.split('.').pop()?.toLowerCase();
  if (extensionFromName && extensionFromName.length <= 5) return extensionFromName;

  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

async function ensureBucket(adminClient: any) {
  const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
  if (listError) throw listError;

  const exists = buckets?.some((bucket: { name?: string; id?: string }) => (
    bucket.name === BUCKET_NAME || bucket.id === BUCKET_NAME
  ));

  if (!exists) {
    const { error: createError } = await adminClient.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: `${MAX_FILE_SIZE}`,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    });

    if (createError && !String(createError.message || '').includes('already exists')) {
      throw createError;
    }
  }
}

export async function POST(request: Request) {
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatorio.' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de imagem invalido.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'A imagem excede o limite de 10MB.' }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    await ensureBucket(adminClient);

    const extension = getExtension(file.name, file.type);
    const filePath = `profiles/${user.id}/avatar-${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({
      url: data.publicUrl,
      path: filePath,
      bucket: BUCKET_NAME,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao enviar avatar.' }, { status: 500 });
  }
}
