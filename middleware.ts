import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory for now, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Apply secure cookie settings
  response.cookies.set({
    name: 'session',
    value: request.cookies.get('session')?.value || '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_IDLE_TIMEOUT / 1000,
    path: '/',
  });

  // Rate limiting for login endpoint
  if (request.nextUrl.pathname === '/api/auth/login') {
    const now = Date.now();

    // Check if IP is locked out
    const lockout = loginAttempts.get(clientIp);
    if (lockout && lockout.lockedUntil && lockout.lockedUntil > now) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          lockedUntil: new Date(lockout.lockedUntil).toISOString()
        },
        { status: 429 }
      );
    }

    // Rate limiting
    const rateLimit = rateLimitMap.get(clientIp);

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
  }

  // CSRF protection for POST requests
  if (request.method === 'POST' && !request.nextUrl.pathname.startsWith('/_next')) {
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieCsrfToken = request.cookies.get('csrf-token')?.value;

    // Skip CSRF check for Supabase auth endpoints (they have their own protection)
    if (!request.nextUrl.pathname.includes('/auth/v1/')) {
      if (!csrfToken || csrfToken !== cookieCsrfToken) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }
  }

  // Generate CSRF token if not present
  if (!request.cookies.get('csrf-token')) {
    const csrfToken = generateCSRFToken();
    response.cookies.set({
      name: 'csrf-token',
      value: csrfToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  // Security headers (additional to vercel.json)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'no-referrer');

  return response;
}

// Helper function to generate CSRF token
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to track failed login attempts
export function trackFailedLogin(clientIp: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(clientIp) || { count: 0 };

  attempts.count++;

  if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOGIN_LOCKOUT_DURATION;
    loginAttempts.set(clientIp, attempts);
    return true; // Account locked
  }

  loginAttempts.set(clientIp, attempts);
  return false;
}

// Helper function to reset login attempts
export function resetLoginAttempts(clientIp: string): void {
  loginAttempts.delete(clientIp);
}

// Clean up old rate limit entries (run periodically)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
