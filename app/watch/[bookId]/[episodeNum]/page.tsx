'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, SkipForward, Clock } from 'lucide-react';
import { getVideoData, VideoData } from '@/lib/api';

function WatchContent() {
  const { bookId, episodeNum } = useParams() as { bookId: string; episodeNum: string };
  const searchParams = useSearchParams();
  const filteredTitle = searchParams.get('filtered_title') ?? '';
  const chapterId = searchParams.get('chapter_id') ?? '';
  const dramaTitle = decodeURIComponent(searchParams.get('title') ?? 'Drama');
  const coverImage = decodeURIComponent(searchParams.get('cover') ?? '');

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!filteredTitle || !chapterId) {
      setError('Parameter tidak lengkap');
      setLoading(false);
      return;
    }
    getVideoData(bookId, parseInt(episodeNum), filteredTitle, chapterId)
      .then(setVideoData)
      .catch(() => setError('Gagal memuat video'))
      .finally(() => setLoading(false));
  }, [bookId, episodeNum, filteredTitle, chapterId]);

  const backHref = `/drama/${bookId}?filtered_title=${encodeURIComponent(filteredTitle)}&title=${encodeURIComponent(dramaTitle)}&cover=${encodeURIComponent(coverImage)}`;

  const nextHref = videoData?.next_episode
    ? `/watch/${bookId}/${videoData.next_episode.episode}?filtered_title=${encodeURIComponent(filteredTitle)}&chapter_id=${encodeURIComponent(videoData.next_episode.chapter_id)}&title=${encodeURIComponent(dramaTitle)}&cover=${encodeURIComponent(coverImage)}`
    : null;

  return (
    <div>
      {/* Back nav */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Kembali
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Episode {episodeNum}</span>
      </div>

      {/* Video */}
      <div style={{ background: '#000', position: 'relative' }}>
        {loading && <div className="shimmer" style={{ paddingBottom: '56.25%' }} />}

        {!loading && error && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {coverImage && (
              <div style={{ position: 'relative', paddingBottom: '56.25%', marginBottom: '16px' }}>
                <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && videoData?.video_url && (
          <video
            controls
            autoPlay
            poster={coverImage || undefined}
            style={{ width: '100%', maxHeight: '320px', display: 'block' }}
            key={videoData.video_url}
          >
            <source src={videoData.video_url} />
            Browser kamu tidak mendukung video.
          </video>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.3 }}>
          {dramaTitle} — Episode {episodeNum}
        </h1>

        {videoData?.duration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '16px' }}>
            <Clock size={13} /> {Math.floor(videoData.duration / 60)}m {videoData.duration % 60}s
          </div>
        )}

        {nextHref && videoData?.next_episode && (
          <Link
            href={nextHref}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text-primary)' }}
          >
            <SkipForward size={18} color="var(--accent)" />
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Berikutnya</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Episode {videoData.next_episode.episode}</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat video...</div>}>
      <WatchContent />
    </Suspense>
  );
}
