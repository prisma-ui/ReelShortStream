'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronLeft, Film } from 'lucide-react';
import { getEpisodeList, EpisodeItem } from '@/lib/api';

function DramaDetailContent() {
  const { bookId } = useParams() as { bookId: string };
  const searchParams = useSearchParams();
  const filteredTitle = searchParams.get('filtered_title') ?? '';
  const dramaTitle = decodeURIComponent(searchParams.get('title') ?? 'Drama');
  const coverImage = decodeURIComponent(searchParams.get('cover') ?? '');

  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filteredTitle) { setLoading(false); return; }
    getEpisodeList(bookId, filteredTitle)
      .then(setEpisodes)
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [bookId, filteredTitle]);

  return (
    <div>
      {/* Header */}
      <div style={{ position: 'relative', height: '260px' }}>
        {coverImage && (
          <Image src={coverImage} alt={dramaTitle} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.97) 100%)' }} />
        <div style={{ position: 'absolute', top: '12px', left: '16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.875rem', textDecoration: 'none', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
            <ChevronLeft size={16} /> Kembali
          </Link>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 20px' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '6px', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>{dramaTitle}</h1>
          {episodes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>
              <Film size={13} /> {episodes.length} Episode
            </div>
          )}
        </div>
      </div>

      {/* Episode list */}
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Daftar Episode</h2>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: '44px', borderRadius: '8px' }} />
            ))}
          </div>
        )}

        {!loading && episodes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '10px' }}>
            {episodes.map(ep => (
              <Link
                key={ep.chapter_id}
                href={`/watch/${bookId}/${ep.episode}?filtered_title=${encodeURIComponent(filteredTitle)}&chapter_id=${encodeURIComponent(ep.chapter_id)}&title=${encodeURIComponent(dramaTitle)}&cover=${encodeURIComponent(coverImage)}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '44px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600,
                  fontSize: '0.85rem', textDecoration: 'none', transition: 'background 0.2s',
                }}
              >
                <Play size={11} style={{ marginRight: '4px', opacity: 0.6 }} />
                {ep.episode}
              </Link>
            ))}
          </div>
        )}

        {!loading && episodes.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Tidak ada episode tersedia</p>
        )}
      </div>
    </div>
  );
}

export default function DramaDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>}>
      <DramaDetailContent />
    </Suspense>
  );
}
