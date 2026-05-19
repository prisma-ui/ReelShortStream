import { NextRequest, NextResponse } from 'next/server';

/**
 * ✅ SECURITY: No NEXT_PUBLIC_ prefix
 * Backend URL adalah server-side only
 * Tidak terekspose ke browser/client
 */
const BACKEND_API = process.env.BACKEND_API_URL;

if (!BACKEND_API) {
  throw new Error(
    'BACKEND_API_URL environment variable is not set. ' +
    'Please add it to .env.local (development) or Vercel dashboard (production). ' +
    'Example: https://reelshort-api-xyz.onrender.com/api/v1/reelshort'
  );
}

/**
 * API Proxy Route Handler
 * 
 * ✅ Security Features:
 * - Backend URL tidak terekspose ke browser
 * - Client hanya tahu proxy URL (/api/reelshort/*)
 * - Attacker tidak bisa access backend langsung
 * - Rate limiting bisa di-apply di proxy
 * 
 * ✅ Performance Features:
 * - Cache response untuk 5 menit (max-age=300)
 * - Stale-while-revalidate untuk background refresh
 * - Timeout protection (15 detik)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const pathname = '/' + pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    /**
     * ✅ Backend URL digunakan di server saja
     * Tidak pernah dikirim ke browser
     */
    const fullUrl = `${BACKEND_API}${pathname}${
      queryString ? '?' + queryString : ''
    }`;

    console.log(`[API Proxy] GET ${fullUrl}`);

    /**
     * Forward request ke backend dengan timeout protection
     */
    const backendResponse = await Promise.race([
      fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent') || 'ReelShortStream/1.0',
          'Accept': request.headers.get('accept') || 'application/json',
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Backend request timeout (15s)')),
          15000
        )
      ),
    ]);

    /**
     * Handle non-OK responses
     */
    if (!backendResponse.ok) {
      console.error(
        `[API Proxy] Backend error: ${backendResponse.status} ${backendResponse.statusText}`
      );
      return NextResponse.json(
        {
          error: 'Backend service unavailable',
          status: backendResponse.status,
          message: backendResponse.statusText,
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    /**
     * ✅ Cache headers untuk performance
     * - max-age=300: Cache 5 menit di browser
     * - stale-while-revalidate=600: Serve stale while fetching new (10 min)
     * - public: CDN bisa cache juga
     */
    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    headers.set('CDN-Cache-Control', 'max-age=300');

    console.log(`[API Proxy] Success: ${pathname}`);

    return NextResponse.json(data, { status: 200, headers });
  } catch (error) {
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error';

    console.error('[API Proxy Error]:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to fetch from backend',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Optional: Handle HEAD requests untuk cache validation
 * HEAD adalah method untuk check if resource exists
 * tanpa download full response body
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const pathname = '/' + pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const fullUrl = `${BACKEND_API}${pathname}${
      queryString ? '?' + queryString : ''
    }`;

    const response = await fetch(fullUrl, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300');
    headers.set('CDN-Cache-Control', 'max-age=300');

    return new NextResponse(null, {
      status: response.status,
      headers,
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
