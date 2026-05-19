// Semua request lewat proxy Next.js — URL asli API tidak terekspose ke browser
const API_BASE = '/api/reelshort';

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

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchDramas(keywords: string): Promise<SearchResult[]> {
  const data = await apiFetch<{ results: SearchResult[] }>(
    `/search?keywords=${encodeURIComponent(keywords)}`
  );
  return data.results ?? [];
}

export async function getEpisodeList(book_id: string, filtered_title: string): Promise<EpisodeItem[]> {
  const data = await apiFetch<{ episodes: EpisodeItem[] }>(
    `/episodes/${book_id}?filtered_title=${encodeURIComponent(filtered_title)}`
  );
  return data.episodes ?? [];
}

export async function getVideoData(
  book_id: string,
  episode_num: number,
  filtered_title: string,
  chapter_id: string
): Promise<VideoData> {
  return apiFetch<VideoData>(
    `/video/${book_id}/${episode_num}?filtered_title=${encodeURIComponent(filtered_title)}&chapter_id=${encodeURIComponent(chapter_id)}`
  );
}

export async function getDramaDub(): Promise<BookshelfData> {
  return apiFetch<BookshelfData>('/dramadub');
}

export async function getNewRelease(): Promise<BookshelfData> {
  return apiFetch<BookshelfData>('/newrelease');
}

export async function getRecommended(): Promise<BookshelfData> {
  return apiFetch<BookshelfData>('/recommend');
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
