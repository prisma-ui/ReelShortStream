'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DramaCard from '@/components/DramaCard';
import { getDramaDub, getNewRelease, getRecommended, bookToDrama, Drama } from '@/lib/api';
import { Grid } from 'lucide-react';

type Shelf = 'newrelease' | 'recommend' | 'dramadub';

const SHELF_LABELS: Record<Shelf, string> = {
  newrelease: 'Rilis Baru',
  recommend: 'Rekomendasi',
  dramadub: 'Drama Dub',
};

// Module-level cache per shelf agar tidak fetch ulang saat kembali ke halaman ini
const shelfCache = new Map<Shelf, Drama[]>();

function BrowseContent() {
  const searchParams = useSearchParams();
  const shelfParam = (searchParams.get('shelf') ?? 'newrelease') as Shelf;
  const [activeShelf, setActiveShelf] = useState<Shelf>(shelfParam);
  const [dramas, setDramas] = useState<Drama[]>(shelfCache.get(shelfParam) ?? []);
  const [loading, setLoading] = useState(!shelfCache.has(shelfParam));
  const [error, setError] = useState<string | null>(null);
  const loadingShelfRef = useRef<Shelf | null>(null);

  useEffect(() => {
    // Jika data shelf ini sudah ada di cache, tampilkan langsung
    if (shelfCache.has(activeShelf)) {
      setDramas(shelfCache.get(activeShelf)!);
      setLoading(false);
      setError(null);
      return;
    }

    // Cegah double-fetch untuk shelf yang sama
    if (loadingShelfRef.current === activeShelf) return;
    loadingShelfRef.current = activeShelf;

    setLoading(true);
    setError(null);

    const fetcher =
      activeShelf === 'dramadub' ? getDramaDub :
      activeShelf === 'recommend' ? getRecommended :
      getNewRelease;

    fetcher()
      .then(data => {
        if (data.books && data.books.length > 0) {
          const mapped = data.books.map(bookToDrama);
          shelfCache.set(activeShelf, mapped);
          setDramas(mapped);
          setError(null);
        } else {
          shelfCache.set(activeShelf, []);
          setDramas([]);
          setError('Tidak ada drama ditemukan di kategori ini');
        }
      })
      .catch(err => {
        console.error(`Error loading ${activeShelf}:`, err);
        setDramas([]);
        setError('Gagal memuat drama. Silakan coba lagi.');
      })
      .finally(() => {
        loadingShelfRef.current = null;
        setLoading(false);
      });
  }, [activeShelf]);

  const handleShelfChange = (shelf: Shelf) => {
    setActiveShelf(shelf);
    // Tampilkan data cache langsung saat ganti tab
    if (shelfCache.has(shelf)) {
      setDramas(shelfCache.get(shelf)!);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Grid size={20} color="var(--accent)" />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Jelajahi Drama</h1>
      </div>

      {/* Shelf tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(Object.keys(SHELF_LABELS) as Shelf[]).map(shelf => (
          <button
            key={shelf}
            onClick={() => handleShelfChange(shelf)}
            style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              background: activeShelf === shelf ? 'var(--accent)' : 'var(--bg-card)',
              color: activeShelf === shelf ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeShelf === shelf ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}
          >
            {SHELF_LABELS[shelf]}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ paddingBottom: '133%', borderRadius: '10px' }} />
            ))
          : dramas.map(d => <DramaCard key={d.id} item={d} />)
        }
      </div>

      {!loading && dramas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Grid size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>{error || 'Tidak ada drama ditemukan'}</p>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
