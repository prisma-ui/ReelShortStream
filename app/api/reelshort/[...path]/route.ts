import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.REELSHORT_API_URL ?? 'https://reelshortapi.onrender.com';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = req.nextUrl.search;
  const url = `${API_BASE}/api/v1/reelshort/${pathname}${search}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}
