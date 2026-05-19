'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play, ChevronLeft, Star, Globe, BookOpen,
  ChevronDown, ChevronUp, Eye, Bookmark, Heart,
  Tag as TagIcon, ThumbsUp
} from 'lucide-react';
import { getDramaDetail, DramaDetail, EpisodeItem, YouMightLike, TagItem } from '@/lib/api';

const detailCache = new Map<string, DramaDetail>();

// ── Format angka besar ─────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Kartu "You Might Like" ─────────────────────────────────────────────────
function YouMightLikeCard({ drama, filteredTitle }: { drama: YouMightLike; filteredTitle: string }) {
  const href = `/drama/${drama.book_id}?filtered_title=${encodeURIComponent(drama.filtered_title)}&title=${encodeURIComponent(drama.book_title)}&cover=${encodeURIComponent(drama.book_pic)}`;
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--bg-hover)' }}>
          {drama.book_pic && (
            <Image
              src={drama.book_pic}
              alt={drama.book_title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="120px"
            />
          )}
          {drama.chapter_count > 0 && (
            <div style={{
              position: 'absolute', bottom: '5px', left: '5px',
              background: 'rgba(0,0,0,0.75)', borderRadius: '4px',
              padding: '2px 6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600,
            }}>
              {drama.chapter_count} Ep
            </div>
          )}
        </div>
        <div style={{ padding: '7px 8px 9px' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)',
            lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
          }}>
            {drama.book_title}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── Tag Pill ───────────────────────────────────────────────────────────────
function TagPill({ tag }: { tag: TagItem }) {
  return (
    <Link
      href={tag.href}
      style={{
        display: 'inline-flex', alignItems: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border-hover)',
        color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600,
        padding: '6px 12px', borderRadius: '20px', letterSpacing: '0.2px',
        textDecoration: 'none', whiteSpace: 'nowrap',
        transition: 'border-color 0.2s, color 0.2s',
      }}
    >
      {tag.text}
    </Link>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────
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
        if (data) { detailCache.set(cacheKey, data); setDetail(data); }
      })
      .finally(() => setLoading(false));
  }, [bookId, filteredTitle, cacheKey]);

  const title       = detail?.book_title   || fallbackTitle;
  const cover       = detail?.book_pic     || fallbackCover;
  const episodes: EpisodeItem[] = detail?.episodes ?? [];
  const synopsis    = detail?.synopsis     || detail?.short_desc || '';
  const categories  = detail?.categories  ?? [];
  const tags        = detail?.tags         ?? [];
  const tagList: TagItem[] = detail?.tag_list ?? [];
  const allTagNames = [...new Set([...categories, ...tags])];
  const score       = detail?.score        ?? 0;
  const totalLikes  = detail?.total_likes  ?? 0;
  const readCount   = detail?.read_count   ?? 0;
  const collectCount = detail?.collect_count ?? 0;
  const language    = detail?.language     ?? '';
  const author      = detail?.author       ?? '';
  const releaseYear = detail?.release_year ?? '';
  const episodeCount = detail?.chapter_count ?? episodes.length;
  const youMightLike: YouMightLike[] = detail?.you_might_like ?? [];

  // Fallback tag untuk display jika tag_list kosong
  const displayTags: TagItem[] = tagList.length > 0
    ? tagList
    : allTagNames.map((name, i) => ({
        id: String(i),
        text: name,
        category_id: '',
        category_slug: 'tags',
        href: `/browse?tag=${encodeURIComponent(name)}`,
      }));

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

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        {cover && (
          <Image src={cover} alt={title} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} priority />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,16,.45) 0%,rgba(8,8,16,.3) 40%,rgba(8,8,16,.98) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(8,8,16,.6) 0%,transparent 60%)' }} />

        {/* Back */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', textDecoration: 'none',
            background: 'rgba(8,8,16,0.5)', backdropFilter: 'blur(8px)',
            padding: '7px 13px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <ChevronLeft size={15} /> Kembali
          </Link>
        </div>

        {/* Score badge */}
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

        {/* Bottom content on hero */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 20px', zIndex: 10 }}>
          {/* Top 3 tag pills on hero */}
          {displayTags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {displayTags.slice(0, 3).map(tag => (
                <span key={tag.id || tag.text} style={{
                  background: 'rgba(232,51,42,0.15)', border: '1px solid rgba(232,51,42,0.25)',
                  color: '#ff7a74', fontSize: '0.6rem', fontWeight: 700,
                  padding: '3px 9px', borderRadius: '20px', letterSpacing: '0.3px',
                }}>{tag.text}</span>
              ))}
            </div>
          )}

          <h1 style={{
            fontSize: '1.5rem', fontWeight: 900, color: '#fff',
            lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.5px',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
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

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 18px', paddingBottom: '40px' }}>

        {/* CTA button */}
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

        {/* ── Stats Row ────────────────────────────────────────────── */}
        {(readCount > 0 || collectCount > 0 || totalLikes > 0 || episodeCount > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: [readCount, collectCount, totalLikes, episodeCount]
              .filter(v => v > 0).length === 4
              ? 'repeat(4, 1fr)'
              : `repeat(${[readCount, collectCount, totalLikes, episodeCount].filter(v => v > 0).length}, 1fr)`,
            gap: '1px',
            marginBottom: '24px',
            background: 'var(--border)',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            {readCount > 0 && (
              <StatCard
                icon={<Eye size={14} style={{ color: '#60a5fa' }} />}
                value={formatCount(readCount)}
                label="DITONTON"
                bg="rgba(96,165,250,0.07)"
              />
            )}
            {collectCount > 0 && (
              <StatCard
                icon={<Bookmark size={14} style={{ color: '#a78bfa' }} />}
                value={formatCount(collectCount)}
                label="DAFTAR"
                bg="rgba(167,139,250,0.07)"
              />
            )}
            {totalLikes > 0 && (
              <StatCard
                icon={<Heart size={14} style={{ color: '#f472b6' }} />}
                value={formatCount(totalLikes)}
                label="LIKES"
                bg="rgba(244,114,182,0.07)"
              />
            )}
            {episodeCount > 0 && (
              <StatCard
                icon={<Play size={14} style={{ color: '#34d399' }} />}
                value={String(episodeCount)}
                label="EPISODE"
                bg="rgba(52,211,153,0.07)"
              />
            )}
          </div>
        )}

        {/* Fallback stats (author) */}
        {author && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', padding: '10px 14px',
            background: 'var(--bg-card)', borderRadius: '10px',
            border: '1px solid var(--border)',
          }}>
            <BookOpen size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENULIS</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>{author}</div>
            </div>
          </div>
        )}

        {/* ── Sinopsis ──────────────────────────────────────────────── */}
        {synopsis && (
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle>Sinopsis</SectionTitle>
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
                {synopsisExpanded
                  ? <><ChevronUp size={14} /> Sembunyikan</>
                  : <><ChevronDown size={14} /> Baca Selengkapnya</>}
              </button>
            )}
          </div>
        )}

        {/* ── Tags ──────────────────────────────────────────────────── */}
        {displayTags.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="section-title-accent" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TagIcon size={14} style={{ color: 'var(--text-muted)' }} /> Tags
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {displayTags.map(tag => (
                <TagPill key={tag.id || tag.text} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* ── Daftar Episode ────────────────────────────────────────── */}
        <div style={{ marginBottom: youMightLike.length > 0 ? '28px' : 0 }}>
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

        {/* ── You Might Like ────────────────────────────────────────── */}
        {youMightLike.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="section-title-accent" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Kamu Mungkin Suka
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}>
              {youMightLike.map(drama => (
                <YouMightLikeCard key={drama.book_id} drama={drama} filteredTitle={filteredTitle} />
              ))}
            </div>
          </div>
        )}

        {/* You Might Like — skeleton while loading */}
        {loading && (
          <div>
            <div className="shimmer" style={{ width: '160px', height: '18px', borderRadius: '6px', marginBottom: '14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="shimmer" style={{ aspectRatio: '3/4', borderRadius: '10px', marginBottom: '6px' }} />
                  <div className="shimmer" style={{ height: '12px', borderRadius: '4px', width: '80%' }} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Reusable helpers ───────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <span className="section-title-accent" />
      <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{children}</h2>
    </div>
  );
}

function StatCard({
  icon, value, label, bg,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  bg: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '5px', padding: '14px 8px', background: bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon}
        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
  );
}

// ── Page exports ───────────────────────────────────────────────────────────

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
        {/* Stats skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '24px', borderRadius: '14px', overflow: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '64px' }} />
          ))}
        </div>
        <div className="shimmer" style={{ width: '80px', height: '16px', borderRadius: '6px', marginBottom: '10px' }} />
        <div className="shimmer" style={{ height: '72px', borderRadius: '8px', marginBottom: '24px' }} />
        <div className="shimmer" style={{ width: '60px', height: '16px', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '30px', width: `${60 + i * 10}px`, borderRadius: '20px' }} />
          ))}
        </div>
        <div className="shimmer" style={{ width: '120px', height: '16px', borderRadius: '6px', marginBottom: '12px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: '8px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '46px', borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
