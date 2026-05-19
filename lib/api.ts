// Semua request lewat proxy Next.js — URL asli API tidak terekspose ke browser
const API_BASE = '/api/reelshort';

// Timeout dalam milliseconds untuk setiap request
const REQUEST_TIMEOUT = 8000; // 8 detik
const MAX_RETRIES = 2; // Maksimal retry jika timeout

// In-memory cache dengan TTL 10 menit
const CACHE_TTL = 10 * 60 * 1000;
const memoryCache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

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

/**
 * Fetch dengan timeout, retry logic, dan in-memory cache
 * @param path - API path
 * @param retries - Jumlah retry yang tersisa
 * @param bypassCache - Skip cache (misal untuk force refresh)
 * @returns Response dari API
 */
async function apiFetch<T>(path: string, retries = MAX_RETRIES, bypassCache = false): Promise<T> {
  // Cek memory cache dulu (kecuali untuk endpoint video/search yang dinamis)
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
      // Jika 5xx error dan masih ada retry, coba lagi
      if (res.status >= 500 && retries > 0) {
        console.warn(`API error ${res.status}, retrying... (${retries} attempts left)`);
        await new Promise(r => setTimeout(r, 500));
        return apiFetch<T>(path, retries - 1, bypassCache);
      }
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();

    // Simpan ke cache (kecuali bypass)
    if (!bypassCache) {
      setCache<T>(path, data);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      if (retries > 0) {
        console.warn(`Request timeout, retrying... (${retries} attempts left)`);
        await new Promise(r => setTimeout(r, 500));
        return apiFetch<T>(path, retries - 1, bypassCache);
      }
      throw new Error('Request timeout after maximum retries');
    }

    throw error;
  }
}

export async function searchDramas(keywords: string): Promise<SearchResult[]> {
  try {
    // Search tidak di-cache karena query dinamis
    const data = await apiFetch<{ results: SearchResult[] }>(
      `/search?keywords=${encodeURIComponent(keywords)}`,
      MAX_RETRIES,
      true
    );
    return data.results ?? [];
  } catch (error) {
    console.error('Error searching dramas:', error);
    return [];
  }
}

export async function getEpisodeList(book_id: string, filtered_title: string): Promise<EpisodeItem[]> {
  try {
    const data = await apiFetch<{ episodes: EpisodeItem[] }>(
      `/episodes/${book_id}?filtered_title=${encodeURIComponent(filtered_title)}`
    );
    return data.episodes ?? [];
  } catch (error) {
    console.error('Error getting episode list:', error);
    return [];
  }
}

export async function getVideoData(
  book_id: string,
  episode_num: number,
  filtered_title: string,
  chapter_id: string
): Promise<VideoData> {
  // Video URL tidak di-cache karena mungkin expire
  return apiFetch<VideoData>(
    `/video/${book_id}/${episode_num}?filtered_title=${encodeURIComponent(filtered_title)}&chapter_id=${encodeURIComponent(chapter_id)}`,
    MAX_RETRIES,
    true
  );
}

export async function getDramaDub(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/dramadub');
  } catch (error) {
    console.error('Error getting drama dub:', error);
    return { bookshelf_name: 'Drama Dub', books: [] };
  }
}

export async function getNewRelease(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/newrelease');
  } catch (error) {
    console.error('Error getting new release:', error);
    return { bookshelf_name: 'New Release', books: [] };
  }
}

export async function getRecommended(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/recommend');
  } catch (error) {
    console.error('Error getting recommended:', error);
    return { bookshelf_name: 'Recommended', books: [] };
  }
}

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
