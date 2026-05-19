'use client';
import { useState, useEffect, useRef } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import DramaSection from '@/components/DramaSection';
import {
  getDramaDub,
  getNewRelease,
  getRecommended,
  bookToDrama,
  Drama,
} from '@/lib/api';

// Module-level cache agar data tetap ada saat navigasi kembali ke homepage
let pageCache: {
  dubDramas: Drama[];
  newReleases: Drama[];
  recommended: Drama[];
} | null = null;

export default function HomePage() {
  const [dubDramas, setDubDramas] = useState<Drama[]>(pageCache?.dubDramas ?? []);
  const [newReleases, setNewReleases] = useState<Drama[]>(pageCache?.newReleases ?? []);
  const [recommended, setRecommended] = useState<Drama[]>(pageCache?.recommended ?? []);
  const [loading, setLoading] = useState(pageCache === null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Jika data sudah ada di cache, skip fetch
    if (pageCache !== null || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        setError(null);

        const [dubRes, newRes, recRes] = await Promise.allSettled([
          getDramaDub(),
          getNewRelease(),
          getRecommended(),
        ]);

        const dub = dubRes.status === 'fulfilled' && dubRes.value.books?.length > 0
          ? dubRes.value.books.map(bookToDrama)
          : [];
        const newR = newRes.status === 'fulfilled' && newRes.value.books?.length > 0
          ? newRes.value.books.map(bookToDrama)
          : [];
        const rec = recRes.status === 'fulfilled' && recRes.value.books?.length > 0
          ? recRes.value.books.map(bookToDrama)
          : [];

        if (dubRes.status === 'rejected') console.error('Failed to fetch drama dub:', dubRes.reason);
        if (newRes.status === 'rejected') console.error('Failed to fetch new releases:', newRes.reason);
        if (recRes.status === 'rejected') console.error('Failed to fetch recommended:', recRes.reason);

        const allFailed =
          dubRes.status === 'rejected' &&
          newRes.status === 'rejected' &&
          recRes.status === 'rejected';

        if (allFailed) {
          setError('Tidak dapat memuat konten. Silakan coba lagi.');
        } else {
          // Simpan ke module-level cache
          pageCache = { dubDramas: dub, newReleases: newR, recommended: rec };
          setDubDramas(dub);
          setNewReleases(newR);
          setRecommended(rec);
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
        setError('Terjadi kesalahan saat memuat konten');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const heroItems = [...newReleases.slice(0, 3), ...recommended.slice(0, 3)].slice(0, 6);
  const hasAnyData = newReleases.length > 0 || recommended.length > 0 || dubDramas.length > 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Memuat Konten...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Menghubungkan ke ReelShort API</p>
      </div>
    );
  }

  if (error && !hasAnyData) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Oops! Terjadi Kesalahan</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {error}
        </p>
        <button
          onClick={() => { pageCache = null; window.location.reload(); }}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      {heroItems.length > 0 ? (
        <HeroCarousel items={heroItems} />
      ) : hasAnyData ? (
        <div style={{ textAlign: 'center', padding: '40px 20px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📺</div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Data sedang dimuat</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Beberapa konten belum siap ditampilkan</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Tidak ada konten</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gagal memuat data dari API</p>
        </div>
      )}

      {newReleases.length > 0 && (
        <DramaSection title="Rilis Baru" items={newReleases.slice(0, 12)} seeAllHref="/browse?shelf=newrelease" />
      )}
      {recommended.length > 0 && (
        <DramaSection title="Rekomendasi" items={recommended.slice(0, 12)} seeAllHref="/browse?shelf=recommend" />
      )}
      {dubDramas.length > 0 && (
        <DramaSection title="Drama  Dub" items={dubDramas.slice(0, 12)} seeAllHref="/browse?shelf=dramadub" />
      )}

      {hasAnyData && (
        <footer style={{ padding: '32px 20px 8px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            ReelShort © 2026 · Powered by ReelShort
          </p>
        </footer>
      )}
    </div>
  );
}
