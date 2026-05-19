import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API = process.env.NEXT_PUBLIC_BACKEND_API || 
  'https://your-api.onrender.com/api/v1/reelshort';

/**
 * ✅ FIXED untuk Next.js 16+ 
 * params sekarang Promise<params> bukan direct params
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // ✅ CHANGED: Await params karena sekarang Promise
    const { path: pathSegments } = await params;
    
    const pathname = '/' + pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = `${BACKEND_API}${pathname}${
      queryString ? '?' + queryString : ''
    }`;

    console.log(`[API Proxy] GET ${fullUrl}`);

    const backendResponse = await Promise.race([
      fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 
            request.headers.get('user-agent') || 'ReelShortStream/1.0',
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

    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
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
 * Optional: Handle HEAD requests
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
