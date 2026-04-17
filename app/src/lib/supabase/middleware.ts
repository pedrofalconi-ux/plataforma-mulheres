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
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname.startsWith('/cadastro/');
  const isStaticAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico' || /\.[a-zA-Z0-9]+$/.test(pathname);
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/sobre' ||
    pathname === '/privacidade' ||
    pathname.startsWith('/blog');

  // 1. Se não houver usuário e a rota não for pública e não for auth/api/static -> LOGIN
  if (!user && !isApiRoute && !isAuthRoute && !isStaticAsset && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Se houver usuário e ele tentar acessar rotas de auth (login/cadastro) -> REDIRECIONAR conforme papel
  if (user && isAuthRoute) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role?.toLowerCase();
    
    const url = request.nextUrl.clone();
    // Se for admin, manda para o admin. Se for aluno e veio do checkout (via redirect), volta para onde ia.
    url.pathname = role === 'admin' ? '/admin' : '/trilhas';
    return NextResponse.redirect(url);
  }

  // 3. Proteção de rotas admin
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role?.toLowerCase() !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
