import { NextRequest, NextResponse } from 'next/server';

if (!process.env.REELSHORT_API_URL) {
  throw new Error('REELSHORT_API_URL belum di-set di .env.local');
}

const API_BASE = process.env.REELSHORT_API_URL;
const API_PATH_PREFIX = process.env.REELSHORT_API_PATH ?? '/api/v1/reelshort';
const UPSTREAM_TIMEOUT = 30000; // 30 detik — HF Space free tier butuh waktu cold start
const MAX_RETRIES = 3;

// Header browser-like agar tidak diblokir oleh upstream
const UPSTREAM_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  // PENTING: Jangan gabungkan `next: { revalidate }` dengan AbortController signal
  // di Next.js 15+. Konflik ini menyebabkan fetch tidak pernah resolve (hang).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: UPSTREAM_HEADERS,
      cache: 'no-store', // next: { revalidate } DIHAPUS — konflik dengan signal di Next.js 15+
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError' && retries > 0) {
      console.warn(`Upstream timeout for ${url}, retrying... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 1000));
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
  const url = `${API_BASE}${API_PATH_PREFIX}/${pathname}${search}`;

  console.log(`[proxy] GET ${url}`);

  try {
    const res = await fetchWithRetry(url);

    if (!res.ok) {
      console.error(`[proxy] Upstream returned ${res.status} for ${pathname}`);
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        {
          status: res.status,
          headers: {
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error(`[proxy] Error for ${pathname}:`, error);

    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const status = isTimeout ? 504 : 502;
    const message = isTimeout
      ? 'API sedang cold start, coba refresh dalam 30 detik'
      : error instanceof Error ? error.message : 'Upstream error';

    return NextResponse.json(
      { error: message },
      {
        status,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  }
}
