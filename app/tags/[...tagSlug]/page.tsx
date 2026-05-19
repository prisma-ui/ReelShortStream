'use client';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import DramaCard from '@/components/DramaCard';
import {
  getDramasByTag,
  getDramasByActorTag,
  getSubTagsByCategory,
  searchResultToDrama,
  TAG_CATEGORIES,
  type Tag,
} from '@/lib/api';
import { Tag as TagIcon, ArrowLeft, Loader2, ChevronRight, ChevronLeft, Users } from 'lucide-react';

interface PageProps {
  params: Promise<{ tagSlug: string[] }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'movie-actors':     '#e85d04',
  'movie-actresses':  '#7b2d8b',
  'movie-identities': '#0077b6',
  'story-beats':      '#1a7a4a',
};

function getCategoryColor(slug: string): string {
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    if (slug === cat || slug.startsWith(cat + '/')) return color;
  }
  return 'var(--accent)';
}

function TagAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%',
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, color,
    }}>
      {initials}
    </div>
  );
}

function Pagination({
  page, totalPages, onPageChange, accentColor,
}: {
  page: number; totalPages: number;
  onPageChange: (p: number) => void; accentColor: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    minWidth: '36px', height: '36px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
    border: '1px solid var(--border)', transition: 'all 0.15s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '6px', padding: '20px 0', flexWrap: 'wrap',
    }}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        style={{ ...btnBase, background: 'var(--bg-card)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 2px', fontSize: '0.85rem' }}>…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p as number)}
            style={{ ...btnBase, background: p === page ? accentColor : 'var(--bg-card)', color: p === page ? '#fff' : 'var(--text-secondary)', border: `1px solid ${p === page ? accentColor : 'var(--border)'}`, fontWeight: p === page ? 800 : 600 }}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        style={{ ...btnBase, background: 'var(--bg-card)', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function TagDramasPage({ params }: PageProps) {
  const { tagSlug: tagSlugParts } = use(params);
  const router = useRouter();

  const categorySlug = tagSlugParts[0] ?? '';
  const actorSlug    = tagSlugParts[1] ?? '';
  const isSubTag     = tagSlugParts.length > 1;
  const fullSlug     = tagSlugParts.join('/');

  const isMainCategory = TAG_CATEGORIES.some(c => c.slug === categorySlug) && !isSubTag;
  const categoryMeta   = TAG_CATEGORIES.find(c => c.slug === categorySlug);
  const accentColor    = getCategoryColor(fullSlug);

  const [subTags, setSubTags]       = useState<Tag[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError]     = useState<string | null>(null);

  const initialName = (actorSlug || categorySlug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const [tagName, setTagName]       = useState(initialName);
  const [dramas, setDramas]         = useState<ReturnType<typeof searchResultToDrama>[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const [view, setView] = useState<'subtags' | 'dramas'>(isMainCategory ? 'subtags' : 'dramas');

  const loadSubTags = useCallback(async () => {
    setSubLoading(true); setSubError(null);
    const data = await getSubTagsByCategory(categorySlug);
    setSubLoading(false);
    if (data) setSubTags(data.sub_tags);
    else setSubError('Gagal memuat daftar tag. Silakan coba lagi.');
  }, [categorySlug]);

  const loadDramas = useCallback(async (targetPage = 1) => {
    setLoading(true); setError(null);
    const data = isSubTag
      ? await getDramasByActorTag(categorySlug, actorSlug, targetPage)
      : await getDramasByTag(categorySlug, targetPage);
    setLoading(false);
    if (data) {
      setTagName(data.tag_name || initialName);
      setDramas(data.dramas.map(searchResultToDrama));
      setPage(data.page ?? targetPage);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? data.dramas.length);
    } else {
      setError('Gagal memuat drama. Silakan coba lagi.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullSlug]);

  useEffect(() => {
    setTagName(initialName);
    setDramas([]); setSubTags([]);
    setError(null); setSubError(null);
    setPage(1); setTotalPages(1); setTotal(0);
    if (isMainCategory) { setView('subtags'); loadSubTags(); }
    else { setView('dramas'); loadDramas(1); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullSlug]);

  const handleShowDramas = () => {
    setView('dramas');
    if (dramas.length === 0 && !loading) loadDramas(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadDramas(newPage);
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: '10px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '50%', width: '34px', height: '34px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowLeft size={16} color="var(--text-secondary)" />
        </button>

        {isMainCategory && categoryMeta
          ? <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{categoryMeta.emoji}</span>
          : <TagIcon size={18} color={accentColor} style={{ flexShrink: 0 }} />
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tagName}
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {view === 'subtags' && subTags.length > 0 && `${subTags.length} tag tersedia`}
            {view === 'dramas' && total > 0 && `${total} drama · hal. ${page}/${totalPages}`}
          </p>
        </div>

        {isMainCategory && subTags.length > 0 && (
          <button
            onClick={() => view === 'dramas' ? setView('subtags') : handleShowDramas()}
            style={{
              padding: '6px 12px', borderRadius: '18px', fontSize: '0.72rem',
              fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${accentColor}`,
              background: view === 'dramas' ? accentColor : 'transparent',
              color: view === 'dramas' ? '#fff' : accentColor,
              transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {view === 'dramas' ? 'Daftar Tag' : 'Semua Drama'}
          </button>
        )}
      </div>

      {/* ── SUB-TAGS VIEW ── */}
      {view === 'subtags' && (
        <div style={{ padding: '12px 16px' }}>
          {subLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {subError && !subLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '14px' }}>{subError}</p>
              <button onClick={loadSubTags} style={{
                padding: '9px 22px', borderRadius: '22px', background: accentColor,
                color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', border: 'none',
              }}>Coba Lagi</button>
            </div>
          )}
          {!subLoading && subTags.length === 0 && !subError && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '2.5rem' }}>{categoryMeta?.emoji}</span>
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Sub-tag tidak tersedia, langsung tampilkan drama.
              </p>
              <button onClick={handleShowDramas} style={{
                marginTop: '16px', padding: '9px 22px', borderRadius: '22px',
                background: accentColor, color: '#fff', fontSize: '0.85rem',
                fontWeight: 700, cursor: 'pointer', border: 'none',
              }}>Lihat Semua Drama</button>
            </div>
          )}
          {!subLoading && subTags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleShowDramas} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: '14px',
                background: `${accentColor}18`, border: `1px solid ${accentColor}40`,
                cursor: 'pointer', marginBottom: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={18} color="#fff" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Semua Drama</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Lihat semua drama di kategori ini</p>
                  </div>
                </div>
                <ChevronRight size={16} color={accentColor} />
              </button>
              {subTags.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => router.push(`/tags/${categorySlug}/${tag.slug}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '12px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor;
                    (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}10`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TagAvatar name={tag.name} color={accentColor} />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{tag.name}</p>
                      {tag.drama_count > 0 && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>{tag.drama_count} drama</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DRAMAS VIEW ── */}
      {view === 'dramas' && (
        <div style={{ padding: '12px 16px' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <TagIcon size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ marginBottom: '16px' }}>{error}</p>
              <button onClick={() => loadDramas(page)} style={{
                padding: '9px 22px', borderRadius: '22px', background: accentColor,
                color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', border: 'none',
              }}>Coba Lagi</button>
            </div>
          )}
          {!loading && !error && dramas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <TagIcon size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Tidak ada drama ditemukan untuk tag ini.</p>
            </div>
          )}
          {!loading && dramas.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '14px',
              }}>
                {dramas.map(drama => (
                  <DramaCard key={drama.id} item={drama} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                accentColor={accentColor}
              />
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
