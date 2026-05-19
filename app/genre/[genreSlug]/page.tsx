'use client';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import DramaCard from '@/components/DramaCard';
import { getDramasByGenre, searchResultToDrama } from '@/lib/api';
import { Film, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ genreSlug: string }>;
}

// Warna aksen: hash sederhana dari genre_id
function slugColor(slug: string): string {
  const PALETTE = [
    '#e85d04','#c1121f','#0077b6','#1b4332',
    '#7b2d8b','#f4a261','#6a0572','#023e8a',
  ];
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

function Pagination({ page, totalPages, onPageChange, accentColor }: {
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '20px 0', flexWrap: 'wrap' }}>
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        style={{ ...btnBase, background: 'var(--bg-card)', color: 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 2px', fontSize: '0.85rem' }}>…</span>
          : <button key={p} onClick={() => onPageChange(p as number)}
              style={{ ...btnBase, background: p === page ? accentColor : 'var(--bg-card)', color: p === page ? '#fff' : 'var(--text-secondary)', border: `1px solid ${p === page ? accentColor : 'var(--border)'}`, fontWeight: p === page ? 800 : 600 }}>
              {p}
            </button>
      )}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        style={{ ...btnBase, background: 'var(--bg-card)', color: 'var(--text-secondary)', opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function GenreDramasPage({ params }: PageProps) {
  const { genreSlug } = use(params);
  const router = useRouter();
  const accentColor = slugColor(genreSlug);

  // Nama awal: tebak dari slug (misal "romance-movies" → "Romance")
  const guessedName = genreSlug
    .replace(/-movies$/, '')
    .replace(/-[0-9a-f]{16,}$/, '')       // hapus objectid jika ada
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const [genreName, setGenreName]   = useState(guessedName);
  const [dramas, setDramas]         = useState<ReturnType<typeof searchResultToDrama>[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const loadDramas = useCallback(async (targetPage = 1) => {
    setLoading(true); setError(null);
    const data = await getDramasByGenre(genreSlug, targetPage);
    setLoading(false);
    if (data) {
      if (data.genre_name) setGenreName(data.genre_name);
      setDramas(data.dramas.map(searchResultToDrama));
      setPage(data.page ?? targetPage);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? data.dramas.length);
    } else {
      setError('Gagal memuat drama. Silakan coba lagi.');
    }
  }, [genreSlug]);

  useEffect(() => {
    setDramas([]); setPage(1); setTotalPages(1); setTotal(0);
    loadDramas(1);
  }, [genreSlug, loadDramas]);

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

        <Film size={18} color={accentColor} style={{ flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {genreName}
          </h1>
          {total > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {total} drama · hal. {page}/{totalPages}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Film size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ marginBottom: '16px' }}>{error}</p>
            <button onClick={() => loadDramas(page)} style={{
              padding: '9px 22px', borderRadius: '22px', background: accentColor,
              color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', border: 'none',
            }}>Coba Lagi</button>
          </div>
        )}
        {!loading && !error && dramas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Film size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>Tidak ada drama ditemukan untuk genre ini.</p>
          </div>
        )}
        {!loading && dramas.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
              {dramas.map(drama => (
                <DramaCard key={drama.id} item={drama} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} accentColor={accentColor} />
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
