'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import DramaCard from '@/components/DramaCard';
import { getDramasByTag, getDramasByActorTag, searchResultToDrama, TAG_CATEGORIES } from '@/lib/api';
import { Tag as TagIcon, ArrowLeft, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ tagSlug: string[] }>;
}

// Tentukan warna berdasarkan parent category
function getCategoryColor(slug: string): string {
  const colors: Record<string, string> = {
    'movie-actors':     '#e85d04',
    'movie-actresses':  '#7b2d8b',
    'movie-identities': '#0077b6',
    'story-beats':      '#1a7a4a',
  };
  for (const [cat, color] of Object.entries(colors)) {
    if (slug === cat || slug.startsWith(cat + '/')) return color;
  }
  return 'var(--accent)';
}

export default function TagDramasPage({ params }: PageProps) {
  // tagSlug adalah array: ['movie-actors'] atau ['movie-actors', 'cameron-saffle-movies-676d...']
  const { tagSlug: tagSlugParts } = use(params);
  const router = useRouter();

  const categorySlug = tagSlugParts[0] ?? '';
  const actorSlug    = tagSlugParts[1] ?? '';
  const isSubTag     = tagSlugParts.length > 1;
  const fullSlug     = tagSlugParts.join('/');

  const initialName = (actorSlug || categorySlug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const [tagName, setTagName] = useState<string>(initialName);
  const [dramas, setDramas] = useState<ReturnType<typeof searchResultToDrama>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accentColor = getCategoryColor(fullSlug);

  const isMainCategory = TAG_CATEGORIES.some(c => c.slug === categorySlug) && !isSubTag;
  const categoryMeta = TAG_CATEGORIES.find(c => c.slug === categorySlug);

  const loadDramas = async () => {
    setLoading(true);
    setError(null);

    let data;
    if (isSubTag) {
      // Sub-tag aktor: /tags/movie-actors/cameron-saffle-movies-676d...
      data = await getDramasByActorTag(categorySlug, actorSlug);
    } else {
      // Kategori utama: /tags/movie-actors
      data = await getDramasByTag(categorySlug);
    }

    setLoading(false);

    if (data) {
      setTagName(data.tag_name || tagName);
      setDramas(data.dramas.map(searchResultToDrama));
    } else {
      setError('Gagal memuat drama untuk tag ini. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    setTagName(initialName);
    setDramas([]);
    setError(null);
    loadDramas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullSlug]);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} color="var(--text-secondary)" />
        </button>

        {/* Badge kategori utama */}
        {isMainCategory && categoryMeta && (
          <span style={{
            fontSize: '1.2rem',
            lineHeight: 1,
          }}>
            {categoryMeta.emoji}
          </span>
        )}

        {!isMainCategory && (
          <TagIcon size={18} color={accentColor} style={{ flexShrink: 0 }} />
        )}

        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>
            {loading ? (
              <span style={{ color: 'var(--text-muted)' }}>
                {(actorSlug || categorySlug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ) : tagName}
          </h1>
          {!loading && dramas.length > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {dramas.length} drama ditemukan
            </p>
          )}
        </div>
      </div>

      {/* Jika ini kategori utama: tampilkan link ke halaman /tags agar bisa pilih sub-tag */}
      {isMainCategory && (
        <div style={{
          margin: '12px 16px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Menampilkan semua drama di kategori ini
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pilih sub-tag untuk lebih spesifik
            </p>
          </div>
          <button
            onClick={() => router.push('/tags')}
            style={{
              padding: '7px 14px',
              borderRadius: '18px',
              background: accentColor,
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Lihat Sub-Tags
          </button>
        </div>
      )}

      {/* Content */}
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
            <button
              onClick={loadDramas}
              style={{
                padding: '9px 22px', borderRadius: '22px',
                background: accentColor, color: '#fff',
                fontSize: '0.85rem', fontWeight: 700,
                cursor: 'pointer', border: 'none',
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && dramas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <TagIcon size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Tidak ada drama ditemukan untuk tag ini.</p>
          </div>
        )}

        {!loading && dramas.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '14px',
          }}>
            {dramas.map(drama => (
              <DramaCard key={drama.id} item={drama} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
