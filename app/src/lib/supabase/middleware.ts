import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApiRoute = pathname.startsWith('/api');
  const isAuthRoute = pathname === '/login';
  const isStaticAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico' || /\.[a-zA-Z0-9]+$/.test(pathname);

  if (!user && !isApiRoute && !isAuthRoute && !isStaticAsset) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute && user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role?.toLowerCase() !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/trilhas';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
