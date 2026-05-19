'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, ChevronLeft, Star, Globe, BookOpen, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { getDramaDetail, DramaDetail, EpisodeItem } from '@/lib/api';

const detailCache = new Map<string, DramaDetail>();

function DramaDetailContent() {
  const { bookId } = useParams() as { bookId: string };
  const searchParams = useSearchParams();
  const filteredTitle = searchParams.get('filtered_title') ?? '';
  const fallbackTitle = decodeURIComponent(searchParams.get('title') ?? 'Drama');
  const fallbackCover = decodeURIComponent(searchParams.get('cover') ?? '');

  const cacheKey = `${bookId}:${filteredTitle}`;
  const [detail, setDetail] = useState<DramaDetail | null>(detailCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!detailCache.has(cacheKey));
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!filteredTitle || detailCache.has(cacheKey) || fetchedRef.current) {
      setLoading(false);
      return;
    }
    fetchedRef.current = true;

    getDramaDetail(bookId, filteredTitle)
      .then(data => {
        if (data) {
          detailCache.set(cacheKey, data);
          setDetail(data);
        }
      })
      .finally(() => setLoading(false));
  }, [bookId, filteredTitle, cacheKey]);

  const title = detail?.book_title || fallbackTitle;
  const cover = detail?.book_pic || fallbackCover;
  const episodes: EpisodeItem[] = detail?.episodes ?? [];
  const synopsis = detail?.synopsis || detail?.short_desc || '';
  const categories = detail?.categories ?? [];
  const tags = detail?.tags ?? [];
  const allTags = [...new Set([...categories, ...tags])];
  const score = detail?.score ?? 0;
  const totalLikes = detail?.total_likes ?? 0;
  const language = detail?.language ?? '';
  const author = detail?.author ?? '';
  const releaseYear = detail?.release_year ?? '';
  const episodeCount = detail?.chapter_count ?? episodes.length;

  const SYNOPSIS_LIMIT = 120;
  const synopsisShort = synopsis.length > SYNOPSIS_LIMIT
    ? synopsis.slice(0, SYNOPSIS_LIMIT) + '…'
    : synopsis;

  const firstEpisode = episodes[0];
  const watchFirstHref = firstEpisode
    ? `/watch/${bookId}/${firstEpisode.episode}?filtered_title=${encodeURIComponent(filteredTitle)}&chapter_id=${encodeURIComponent(firstEpisode.chapter_id)}&title=${encodeURIComponent(title)}&cover=${encodeURIComponent(cover)}`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        {cover && (
          <Image src={cover} alt={title} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} priority />
        )}
        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,16,0.45) 0%, rgba(8,8,16,0.3) 40%, rgba(8,8,16,0.98) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,8,16,0.6) 0%, transparent 60%)' }} />

        {/* Back button */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', textDecoration: 'none',
            background: 'rgba(8,8,16,0.5)', backdropFilter: 'blur(8px)',
            padding: '7px 13px', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <ChevronLeft size={15} /> Kembali
          </Link>
        </div>

        {/* Score badge top right */}
        {score > 0 && (
          <div style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: '20px', padding: '4px 10px',
          }}>
            <Star size={12} fill="#f5c842" color="#f5c842" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f5c842' }}>
              {score.toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 20px', zIndex: 10 }}>
          {/* Category tags */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {allTags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  background: 'rgba(232,51,42,0.15)', border: '1px solid rgba(232,51,42,0.25)',
                  color: '#ff7a74', fontSize: '0.6rem', fontWeight: 700,
                  padding: '3px 9px', borderRadius: '20px', letterSpacing: '0.3px'
                }}>{tag}</span>
              ))}
            </div>
          )}

          <h1 style={{
            fontSize: '1.5rem', fontWeight: 900, color: '#fff',
            lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.5px',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)'
          }}>{title}</h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
              {episodeCount} Episode
            </span>
            {releaseYear && (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{releaseYear}</span>
            )}
            {language && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                <Globe size={11} /> {language}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div style={{ padding: '0 18px', paddingBottom: '32px' }}>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '24px' }}>
          {watchFirstHref ? (
            <Link href={watchFirstHref} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', background: 'var(--accent)', color: '#fff',
              padding: '13px 20px', borderRadius: '12px', fontSize: '0.9rem',
              fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.2px',
              boxShadow: '0 4px 24px rgba(232,51,42,0.4)',
            }}>
              <Play size={15} fill="#fff" strokeWidth={0} /> Tonton Ep. 1
            </Link>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', background: 'var(--bg-hover)', color: 'var(--text-muted)',
              padding: '13px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800,
            }}>
              <Play size={15} strokeWidth={2} /> Memuat...
            </div>
          )}
        </div>

        {/* ── Stats row ─────────────────────────────────── */}
        {(totalLikes > 0 || author) && (
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '24px',
            background: 'var(--bg-card)', borderRadius: '12px', padding: '14px 16px',
            border: '1px solid var(--border)',
          }}>
            {totalLikes > 0 && (
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {totalLikes >= 1000000
                    ? `${(totalLikes / 1000000).toFixed(1)}M`
                    : totalLikes >= 1000
                    ? `${(totalLikes / 1000).toFixed(0)}K`
                    : totalLikes}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>LIKES</div>
              </div>
            )}
            {episodeCount > 0 && (
              <div style={{ flex: 1, textAlign: 'center', borderLeft: totalLikes > 0 ? '1px solid var(--border)' : 'none', paddingLeft: totalLikes > 0 ? '12px' : 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {episodeCount}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>EPISODE</div>
              </div>
            )}
            {author && (
              <div style={{ flex: 2, borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {author}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENULIS</div>
              </div>
            )}
          </div>
        )}

        {/* ── Sinopsis ───────────────────────────────────── */}
        {synopsis && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="section-title-accent" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sinopsis</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.75, letterSpacing: '0.1px' }}>
              {synopsisExpanded ? synopsis : synopsisShort}
            </p>
            {synopsis.length > SYNOPSIS_LIMIT && (
              <button
                onClick={() => setSynopsisExpanded(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 700, padding: 0,
                }}
              >
                {synopsisExpanded ? <><ChevronUp size={14} /> Sembunyikan</> : <><ChevronDown size={14} /> Baca Selengkapnya</>}
              </button>
            )}
          </div>
        )}

        {/* ── Kategori / Genre ───────────────────────────── */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="section-title-accent" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Kategori</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allTags.map(tag => (
                <span key={tag} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-hover)',
                  color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600,
                  padding: '6px 13px', borderRadius: '20px', letterSpacing: '0.2px',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Daftar Episode ─────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="section-title-accent" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daftar Episode
              {episodes.length > 0 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                  ({episodes.length})
                </span>
              )}
            </h2>
          </div>

          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: '46px', borderRadius: '10px' }} />
              ))}
            </div>
          )}

          {!loading && episodes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '8px' }}>
              {episodes.map(ep => (
                <Link
                  key={ep.chapter_id}
                  href={`/watch/${bookId}/${ep.episode}?filtered_title=${encodeURIComponent(filteredTitle)}&chapter_id=${encodeURIComponent(ep.chapter_id)}&title=${encodeURIComponent(title)}&cover=${encodeURIComponent(cover)}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '3px',
                    height: '46px', background: 'var(--bg-card)',
                    border: ep.episode === 1 ? '1px solid rgba(232,51,42,0.4)' : '1px solid var(--border)',
                    borderRadius: '10px', color: ep.episode === 1 ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Play size={9} style={{ opacity: 0.5 }} />
                  {ep.episode}
                </Link>
              ))}
            </div>
          )}

          {!loading && episodes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.82rem' }}>Tidak ada episode tersedia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DramaDetailPage() {
  return (
    <Suspense fallback={<DramaDetailSkeleton />}>
      <DramaDetailContent />
    </Suspense>
  );
}

function DramaDetailSkeleton() {
  return (
    <div>
      <div className="shimmer" style={{ height: '320px', borderRadius: 0 }} />
      <div style={{ padding: '20px 18px' }}>
        <div className="shimmer" style={{ height: '48px', borderRadius: '12px', marginBottom: '24px' }} />
        <div className="shimmer" style={{ height: '80px', borderRadius: '12px', marginBottom: '24px' }} />
        <div className="shimmer" style={{ width: '100px', height: '18px', borderRadius: '6px', marginBottom: '12px' }} />
        <div className="shimmer" style={{ height: '72px', borderRadius: '8px', marginBottom: '24px' }} />
        <div className="shimmer" style={{ width: '100px', height: '18px', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '8px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '46px', borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
