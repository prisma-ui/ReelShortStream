import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.REELSHORT_API_URL ?? 'https://reelshortapi.onrender.com';
const UPSTREAM_TIMEOUT = 7000; // 7 detik timeout untuk upstream API
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 }, // cache 5 menit di Next.js edge
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry jika timeout dan masih ada attempt tersisa
    if (error instanceof Error && error.name === 'AbortError' && retries > 0) {
      console.warn(`Upstream timeout for ${url}, retrying... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 300));
      return fetchWithRetry(url, retries - 1);
    }

    throw error;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = req.nextUrl.search;
  const url = `${API_BASE}/api/v1/reelshort/${pathname}${search}`;

  try {
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy error for ${pathname}:`, error);
    
    // Return 504 Gateway Timeout jika timeout, 502 untuk error lainnya
    const status = error instanceof Error && error.name === 'AbortError' ? 504 : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upstream error' }, 
      { status }
    );
  }
}
