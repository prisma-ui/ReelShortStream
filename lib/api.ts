const API_BASE = '/api/reelshort';

const REQUEST_TIMEOUT = 35000; // 35 detik — lebih panjang dari upstream timeout (30s)
const MAX_RETRIES = 2;
const CACHE_TTL = 10 * 60 * 1000;

const memoryCache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { memoryCache.delete(key); return null; }
  return entry.data as T;
}
function setCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  book_id: string;
  book_title: string;
  filtered_title: string;
  book_pic: string;
  chapter_count: number;
}

export interface EpisodeItem {
  episode: number;
  chapter_id: string;
}

export interface VideoData {
  video_url: string;
  episode: number;
  duration: number;
  next_episode: EpisodeItem | null;
}

export interface ChapterInfo {
  chapter_id: string;
  chapter_name: string;
  like_count: number;
  publish_at: string;
  create_time: string;
}

export interface BookInfo {
  book_title: string;
  filtered_title: string;
  book_pic: string;
  special_desc: string;
  chapter_count: number;
  book_id: string;
  chapter_base: ChapterInfo[];
}

export interface BookshelfData {
  bookshelf_name: string;
  books: BookInfo[];
}

export interface Drama {
  id: string;
  title: string;
  filtered_title: string;
  cover_image: string;
  description?: string;
  episode_count?: number;
  tags?: string[];
  chapters?: ChapterInfo[];
}

export interface DramaDetail {
  book_id: string;
  book_title: string;
  filtered_title: string;
  book_pic: string;
  banner_pic?: string;
  synopsis?: string;
  short_desc?: string;
  chapter_count: number;
  categories?: string[];
  tags?: string[];
  language?: string;
  score?: number;
  total_likes?: number;
  author?: string;
  release_year?: string;
  episodes: EpisodeItem[];
}

export interface EpisodeDetail {
  id: string;
  drama_id: string;
  drama_title: string;
  filtered_title: string;
  episode_number: number;
  cover_image: string;
  video_url?: string;
  duration?: number;
  next_episode?: EpisodeItem | null;
}

// ── Fetch helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, retries = MAX_RETRIES, bypassCache = false): Promise<T> {
  if (!bypassCache) {
    const cached = getCached<T>(path);
    if (cached !== null) return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Baca error message dari proxy jika ada
      let errMsg = `API error: ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error) errMsg = errBody.error;
      } catch { /* ignore */ }

      if (res.status >= 500 && retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return apiFetch<T>(path, retries - 1, bypassCache);
      }
      throw new Error(errMsg);
    }

    const data = await res.json();

    // Validasi: pastikan data bukan error object dari proxy
    if (data && typeof data === 'object' && 'error' in data && Object.keys(data).length === 1) {
      throw new Error(String(data.error));
    }

    if (!bypassCache) setCache<T>(path, data);
    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return apiFetch<T>(path, retries - 1, bypassCache);
      }
      throw new Error('Request timeout — API mungkin sedang cold start, coba refresh');
    }
    throw error;
  }
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function searchDramas(keywords: string): Promise<SearchResult[]> {
  try {
    const data = await apiFetch<{ results: SearchResult[] }>(
      `/search?keywords=${encodeURIComponent(keywords)}`, MAX_RETRIES, true
    );
    return data.results ?? [];
  } catch { return []; }
}

export async function getDramaDetail(book_id: string, filtered_title: string): Promise<DramaDetail | null> {
  try {
    return await apiFetch<DramaDetail>(
      `/drama/${book_id}?filtered_title=${encodeURIComponent(filtered_title)}`,
      MAX_RETRIES, false
    );
  } catch (error) {
    console.error('Error getDramaDetail:', error);
    return null;
  }
}

export async function getEpisodeList(book_id: string, filtered_title: string): Promise<EpisodeItem[]> {
  try {
    const data = await apiFetch<{ episodes: EpisodeItem[] }>(
      `/episodes/${book_id}?filtered_title=${encodeURIComponent(filtered_title)}`
    );
    return data.episodes ?? [];
  } catch { return []; }
}

export async function getVideoData(
  book_id: string, episode_num: number,
  filtered_title: string, chapter_id: string
): Promise<VideoData> {
  return apiFetch<VideoData>(
    `/video/${book_id}/${episode_num}?filtered_title=${encodeURIComponent(filtered_title)}&chapter_id=${encodeURIComponent(chapter_id)}`,
    MAX_RETRIES, true
  );
}

export async function getDramaDub(): Promise<BookshelfData> {
  try { return await apiFetch<BookshelfData>('/dramadub'); }
  catch { return { bookshelf_name: 'Drama Dub', books: [] }; }
}

export async function getNewRelease(): Promise<BookshelfData> {
  try { return await apiFetch<BookshelfData>('/newrelease'); }
  catch { return { bookshelf_name: 'New Release', books: [] }; }
}

export async function getRecommended(): Promise<BookshelfData> {
  try { return await apiFetch<BookshelfData>('/recommend'); }
  catch { return { bookshelf_name: 'Recommended', books: [] }; }
}

// ── Converters ────────────────────────────────────────────────────────────

export function bookToDrama(book: BookInfo): Drama {
  return {
    id: book.book_id,
    title: book.book_title,
    filtered_title: book.filtered_title,
    cover_image: book.book_pic,
    description: book.special_desc,
    episode_count: book.chapter_count,
    chapters: book.chapter_base,
  };
}

export function searchResultToDrama(result: SearchResult): Drama {
  return {
    id: result.book_id,
    title: result.book_title,
    filtered_title: result.filtered_title,
    cover_image: result.book_pic,
    episode_count: result.chapter_count,
  };
}

export function getCoverImage(item: Drama | EpisodeDetail | SearchResult): string {
  if ('cover_image' in item) return item.cover_image || '/placeholder.jpg';
  if ('book_pic' in item) return item.book_pic || '/placeholder.jpg';
  return '/placeholder.jpg';
}
