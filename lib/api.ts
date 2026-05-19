// ✅ UPDATED: Proxy lewat Next.js API route dengan caching
// Sebelumnya: fetch langsung ke backend (terus timeout/loading)
// Sekarang: fetch ke Next.js proxy yang bisa cache response
const API_BASE = '/api/reelshort';

// Timeout dalam milliseconds untuk setiap request
const REQUEST_TIMEOUT = 12000; // 12 detik (lebih tolerant)
const MAX_RETRIES = 2;

// ✅ NEW: Request deduplication untuk mencegah race conditions
const pendingRequests = new Map<string, Promise<any>>();

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
 * ✅ IMPROVED: Fetch dengan proper caching, timeout, dan request deduplication
 * @param path - API path
 * @param retries - Jumlah retry yang tersisa
 * @returns Response dari API
 */
async function apiFetch<T>(path: string, retries = MAX_RETRIES): Promise<T> {
  // ✅ NEW: Jika request yang sama sudah pending, tunggu hasilnya
  // Mencegah multiple simultaneous requests ke endpoint yang sama
  if (pendingRequests.has(path)) {
    console.debug(`[API] Using cached request for: ${path}`);
    return pendingRequests.get(path)!;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  // ✅ NEW: Store promise agar request lain bisa menunggu
  const requestPromise = (async () => {
    try {
      // ✅ CHANGED: cache: 'default' instead of 'no-store'
      // Ini mengizinkan browser + Next.js untuk cache response
      // Cache headers dari server akan di-respek oleh browser
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'default', // ✅ Browser akan cache berdasarkan Cache-Control header
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Jika 5xx error dan masih ada retry, coba lagi
        if (res.status >= 500 && retries > 0) {
          console.warn(
            `[API] Error ${res.status}, retrying... (${retries} attempts left)`
          );
          // Tunggu sebentar sebelum retry (exponential backoff)
          await new Promise((r) => setTimeout(r, 1000));
          return apiFetch<T>(path, retries - 1);
        }

        // Jika 4xx error, don't retry (client error)
        if (res.status >= 400 && res.status < 500) {
          const errorText = await res.text();
          throw new Error(
            `API error ${res.status}: ${errorText || res.statusText}`
          );
        }

        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        if (retries > 0) {
          console.warn(
            `[API] Request timeout, retrying... (${retries} attempts left)`
          );
          await new Promise((r) => setTimeout(r, 1000));
          return apiFetch<T>(path, retries - 1);
        }
        throw new Error('Request timeout after maximum retries');
      }

      throw error;
    }
  })();

  pendingRequests.set(path, requestPromise);

  try {
    return await requestPromise;
  } finally {
    // ✅ NEW: Cleanup setelah request selesai
    // Tapi keep cache di pendingRequests untuk SWR pattern
    setTimeout(() => {
      pendingRequests.delete(path);
    }, 300); // Grace period 300ms untuk deduplicate rapid requests
  }
}

export async function searchDramas(keywords: string): Promise<SearchResult[]> {
  try {
    const data = await apiFetch<{ results: SearchResult[] }>(
      `/search?keywords=${encodeURIComponent(keywords)}`
    );
    return data.results ?? [];
  } catch (error) {
    console.error('[API] Error searching dramas:', error);
    return [];
  }
}

export async function getEpisodeList(
  book_id: string,
  filtered_title: string
): Promise<EpisodeItem[]> {
  try {
    const data = await apiFetch<{ episodes: EpisodeItem[] }>(
      `/episodes/${book_id}?filtered_title=${encodeURIComponent(
        filtered_title
      )}`
    );
    return data.episodes ?? [];
  } catch (error) {
    console.error('[API] Error getting episode list:', error);
    return [];
  }
}

export async function getVideoData(
  book_id: string,
  episode_num: number,
  filtered_title: string,
  chapter_id: string
): Promise<VideoData> {
  return apiFetch<VideoData>(
    `/video/${book_id}/${episode_num}?filtered_title=${encodeURIComponent(
      filtered_title
    )}&chapter_id=${encodeURIComponent(chapter_id)}`
  );
}

export async function getDramaDub(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/dramadub');
  } catch (error) {
    console.error('[API] Error getting drama dub:', error);
    return { bookshelf_name: 'Drama Dub', books: [] };
  }
}

export async function getNewRelease(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/newrelease');
  } catch (error) {
    console.error('[API] Error getting new release:', error);
    return { bookshelf_name: 'New Release', books: [] };
  }
}

export async function getRecommended(): Promise<BookshelfData> {
  try {
    return await apiFetch<BookshelfData>('/recommend');
  } catch (error) {
    console.error('[API] Error getting recommended:', error);
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

export function getCoverImage(
  item: Drama | EpisodeDetail | SearchResult
): string {
  if ('cover_image' in item) return item.cover_image || '/placeholder.jpg';
  if ('book_pic' in item) return item.book_pic || '/placeholder.jpg';
  return '/placeholder.jpg';
}
