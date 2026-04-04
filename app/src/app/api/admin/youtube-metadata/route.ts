import { NextResponse } from 'next/server';
import { requireAdmin, sanitizeText } from '@/lib/admin-api';

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function extractYouTubeVideoId(url: string) {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function fetchYouTubeDurationMinutes(videoId: string) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DignareBot/1.0)',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o video no YouTube.');
  }

  const html = await response.text();
  const match = html.match(/"lengthSeconds":"(\d+)"/) || html.match(/"approxDurationMs":"(\d+)"/);

  if (!match?.[1]) {
    throw new Error('Nao foi possivel identificar a duracao do video.');
  }

  const rawValue = Number(match[1]);
  const seconds = html.includes('"approxDurationMs"') ? Math.round(rawValue / 1000) : rawValue;
  return Math.max(1, Math.ceil(seconds / 60));
}

export async function GET(request: Request) {
  try {
    const adminContext = await requireAdmin();
    if (adminContext instanceof NextResponse) return adminContext;

    const { searchParams } = new URL(request.url);
    const rawUrl = sanitizeText(searchParams.get('url') || '');

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL obrigatoria.' }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'URL do YouTube invalida.' }, { status: 400 });
    }

    const durationMinutes = await fetchYouTubeDurationMinutes(videoId);

    return NextResponse.json({
      videoId,
      duration_minutes: durationMinutes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Falha ao ler metadados do YouTube.' }, { status: 500 });
  }
}
