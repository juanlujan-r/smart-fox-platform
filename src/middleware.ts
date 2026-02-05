import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/pos',
  '/inventory',
  '/hr',
  '/admin',
  '/profile',
  '/requests',
  '/shifts',
] as const;

const HR_OR_ADMIN_PATHS = ['/hr-management', '/hr', '/admin'] as const;
const ADMIN_ONLY_PATHS = ['/admin'] as const;

type Role = 'empleado' | 'supervisor' | 'gerente';

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isHrOrAdminPath(pathname: string): boolean {
  return HR_OR_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Session refresh: getSession() refreshes the session on every request (Supabase best practice)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login');
  const isProtected = isProtectedPath(pathname);

  // No session + protected route -> redirect to login
  if (!session && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Active session + login page -> redirect to dashboard
  if (session && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Role-based access control (only when user is logged in and hitting a restricted path)
  if (session?.user && isHrOrAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = (profile?.role as Role) ?? 'empleado';

    // empleado: cannot access /hr-management, /hr, or /admin
    if (role === 'empleado' && isHrOrAdminPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // supervisor: cannot access /admin
    if (role === 'supervisor' && isAdminOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // gerente: allowed all routes (no redirect)
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match dashboard and auth routes; exclude static files and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
