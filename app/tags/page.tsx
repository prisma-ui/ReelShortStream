'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TAG_CATEGORIES, getSubTagsByCategory, TagCategory } from '@/lib/api';
import { Tag as TagIcon, ChevronRight, Loader2 } from 'lucide-react';

// Warna aksen per kategori
const CATEGORY_COLORS: Record<string, string> = {
  'movie-actors':     '#e85d04',
  'movie-actresses':  '#7b2d8b',
  'movie-identities': '#0077b6',
  'story-beats':      '#1a7a4a',
};

export default function TagsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>(TAG_CATEGORIES[0].slug);
  const [categoryData, setCategoryData] = useState<Record<string, TagCategory>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  const loadCategory = async (slug: string) => {
    if (categoryData[slug] || loading[slug]) return;
    setLoading(prev => ({ ...prev, [slug]: true }));
    setError(prev => ({ ...prev, [slug]: '' }));

    const data = await getSubTagsByCategory(slug);
    setLoading(prev => ({ ...prev, [slug]: false }));
    if (data) {
      setCategoryData(prev => ({ ...prev, [slug]: data }));
    } else {
      setError(prev => ({ ...prev, [slug]: 'Gagal memuat sub-tags. Coba lagi.' }));
    }
  };

  // Load kategori aktif saat pertama kali
  useEffect(() => {
    loadCategory(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const accentColor = CATEGORY_COLORS[activeCategory] || 'var(--accent)';
  const currentData = categoryData[activeCategory];
  const isLoading  = loading[activeCategory];
  const currentErr = error[activeCategory];

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <TagIcon size={20} color="var(--accent)" />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tags</h1>
      </div>

      {/* Kategori Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '0 16px 12px',
        scrollbarWidth: 'none',
      }}>
        {TAG_CATEGORIES.map(cat => {
          const color = CATEGORY_COLORS[cat.slug];
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => {
                setActiveCategory(cat.slug);
                loadCategory(cat.slug);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '24px',
                fontSize: '0.8rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: `1.5px solid ${isActive ? color : 'var(--border)'}`,
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '1rem' }}>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tags Grid */}
      <div style={{ padding: '4px 16px' }}>
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {currentErr && !isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>{currentErr}</p>
            <button
              onClick={() => {
                setError(prev => ({ ...prev, [activeCategory]: '' }));
                loadCategory(activeCategory);
              }}
              style={{
                marginTop: '12px', padding: '8px 20px', borderRadius: '20px',
                background: accentColor, color: '#fff', fontSize: '0.85rem',
                fontWeight: 600, cursor: 'pointer', border: 'none',
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {currentData && !isLoading && (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {currentData.total} sub-tag ditemukan
            </p>

            {currentData.sub_tags.length === 0 ? (
              /* Fallback: jika API belum mengembalikan sub-tags (data kosong),
                 tampilkan pesan informatif */
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: 'var(--bg-card)', borderRadius: '12px',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '2.5rem' }}>
                  {TAG_CATEGORIES.find(c => c.slug === activeCategory)?.emoji}
                </span>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Sub-tags untuk kategori ini belum tersedia.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                  Klik tombol di bawah untuk lihat drama langsung.
                </p>
                <button
                  onClick={() => router.push(`/tags/${activeCategory}`)}
                  style={{
                    marginTop: '16px', padding: '9px 22px', borderRadius: '22px',
                    background: accentColor, color: '#fff', fontSize: '0.85rem',
                    fontWeight: 700, cursor: 'pointer', border: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  Lihat Semua Drama
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
              }}>
                {currentData.sub_tags.map(tag => (
                  <button
                    key={tag.slug}
                    onClick={() => router.push(`/tags/${activeCategory}/${tag.slug}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor;
                      (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}15`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                    }}
                  >
                    <div>
                      <p style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '3px',
                        lineHeight: 1.2,
                      }}>
                        {tag.name}
                      </p>
                      {tag.drama_count > 0 && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {tag.drama_count} drama
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
