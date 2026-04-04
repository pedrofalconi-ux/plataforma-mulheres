import { NextResponse } from 'next/server';
import { logAuditEvent, requireAdmin } from '@/lib/admin-api';

const BUCKET_NAME = 'platform-media';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
]);
const ALLOWED_MIME_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]);

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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
    case 'application/pdf':
      return 'pdf';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'video/mp4':
      return 'mp4';
    case 'application/zip':
    case 'application/x-zip-compressed':
      return 'zip';
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
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    });

    if (createError && !String(createError.message || '').includes('already exists')) {
      throw createError;
    }
  }
}

export async function POST(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const formData = await request.formData();
    const file = formData.get('file');
    const courseIdRaw = String(formData.get('courseId') || '');
    const assetTypeRaw = String(formData.get('assetType') || 'general');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo obrigatorio.' }, { status: 400 });
    }

    if (!courseIdRaw) {
      return NextResponse.json({ error: 'courseId obrigatorio.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Formato de arquivo invalido para upload.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite de 25MB.' }, { status: 400 });
    }

    await ensureBucket(adminContext.adminClient);

    const courseId = sanitizeSegment(courseIdRaw);
    const assetType = sanitizeSegment(assetTypeRaw || 'general');
    const extension = getExtension(file.name, file.type);
    const filePath = `courses/${courseId}/${assetType}-${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminContext.adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = adminContext.adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const publicUrl = publicData.publicUrl;

    await logAuditEvent({
      adminClient: adminContext.adminClient,
      profileId: adminContext.user.id,
      action: 'UPLOAD_COURSE_ASSET',
      entityName: 'storage',
      entityId: courseIdRaw,
      newValue: {
        bucket: BUCKET_NAME,
        path: filePath,
        publicUrl,
        assetType,
      },
      request,
    });

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
      bucket: BUCKET_NAME,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao enviar arquivo.' }, { status: 500 });
  }
}
