import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - ambil dari env atau default
const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || 
  'https://your-api.onrender.com/api/v1/reelshort';

/**
 * Proxy handler untuk semua request ke ReelShort API backend
 * Handles: /api/reelshort/*
 * 
 * Fitur:
 * - Caching dengan max-age 300 detik (5 menit)
 * - Error handling yang proper
 * - Request logging
 * - CORS-safe (Next.js handle di edge)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // 1. Reconstruct full path dari dynamic route parameters
    const pathSegments = params.path;
    const pathname = '/' + pathSegments.join('/');
    
    // 2. Copy semua query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = `${BACKEND_API}${pathname}${
      queryString ? '?' + queryString : ''
    }`;

    console.log(`[API Proxy] GET ${fullUrl}`);

    // 3. Forward request ke backend dengan timeout
    const backendResponse = await Promise.race([
      fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 
            request.headers.get('user-agent') || 'ReelShortStream/1.0',
          // Forward original headers jika perlu
          'Accept': request.headers.get('accept') || 'application/json',
        },
      }),
      // Timeout 15 detik
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Backend request timeout (15s)')),
          15000
        )
      ),
    ]);

    if (!backendResponse.ok) {
      console.error(
        `[API Proxy] Backend error: ${backendResponse.status} ${backendResponse.statusText}`
      );

      // Jika backend down, return error yang meaningful
      return NextResponse.json(
        {
          error: 'Backend service unavailable',
          status: backendResponse.status,
          message: backendResponse.statusText,
        },
        { status: backendResponse.status }
      );
    }

    // 4. Parse response dari backend
    const data = await backendResponse.json();

    // 5. Set cache headers untuk browser + CDN
    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // ⭐ PENTING: Cache di browser selama 5 menit
    // public = bisa di-cache CDN + browser
    // max-age=300 = cache duration dalam detik
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    // Tambahan headers untuk Vercel/Edge caching
    headers.set('CDN-Cache-Control', 'max-age=300');

    console.log(`[API Proxy] Success: ${pathname}`);

    return NextResponse.json(data, {
      status: 200,
      headers,
    });
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
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path;
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
