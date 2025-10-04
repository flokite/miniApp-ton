// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Definir runtime Edge
export const runtime = 'edge';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/home',
  '/profile',
  '/admin',
  '/api/protected'
];

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica se a rota é protegida
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Pega token do cookie, header ou query
  const token = getTokenFromRequest(request);

  console.log('Token encontrado:', token ? 'Sim' : 'Não');
  console.log('Rota protegida:', pathname);

  if (!token) {
    console.log('Token não encontrado');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verifica JWT usando 'jose'
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    console.log('Token válido:', payload);
    // Se quiser, você pode anexar o payload ao request para uso posterior:
    // request.user = payload; // ⚠️ no Edge Runtime, não persiste entre middlewares e rotas

    return NextResponse.next();
  } catch (err) {
    console.error('Token inválido ou expirado:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('error', 'session_expired');
    return NextResponse.redirect(loginUrl);
  }
}

// Função para extrair token do request
function getTokenFromRequest(request: NextRequest): string | null {
  // Cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;

  // Header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Query string (para testes)
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  return null;
}

// Configuração do matcher (quais rotas a middleware roda)
export const config = {
  matcher: [
    '/home',
    '/home/:path*',
    '/profile',
    '/profile/:path*',
    '/admin',
    '/admin/:path*',
    '/api/protected',
    '/api/protected/:path*'
  ],
};
