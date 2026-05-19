'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import DramaSection from '@/components/DramaSection';
import SkeletonHome from '@/components/SkeletonHome';
import { getDramaDub, getNewRelease, getRecommended, bookToDrama, Drama } from '@/lib/api';

interface HomeData {
  newReleases: Drama[];
  recommended: Drama[];
  dubDramas: Drama[];
}

const RETRY_INTERVAL = 5000; // coba lagi tiap 5 detik
const MAX_RETRIES = 12;       // maksimal 1 menit (12 × 5s)

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    const [newRes, recRes, dubRes] = await Promise.allSettled([
      getNewRelease(),
      getRecommended(),
      getDramaDub(),
    ]);

    const newReleases = newRes.status === 'fulfilled' && newRes.value.books?.length > 0
      ? newRes.value.books.map(bookToDrama) : [];
    const recommended = recRes.status === 'fulfilled' && recRes.value.books?.length > 0
      ? recRes.value.books.map(bookToDrama) : [];
    const dubDramas = dubRes.status === 'fulfilled' && dubRes.value.books?.length > 0
      ? dubRes.value.books.map(bookToDrama) : [];

    const hasAnyData = newReleases.length > 0 || recommended.length > 0 || dubDramas.length > 0;
    return hasAnyData ? { newReleases, recommended, dubDramas } : null;
  }, []);

  // Fetch pertama kali
  useEffect(() => {
    fetchData().then(result => {
      if (result) {
        setData(result);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [fetchData]);

  // Auto-retry polling saat error
  useEffect(() => {
    if (!error) return;
    if (retryCount >= MAX_RETRIES) return;

    retryTimer.current = setTimeout(async () => {
      setRetryCount(c => c + 1);
      const result = await fetchData();
      if (result) {
        setError(false);
        setData(result);
      }
    }, RETRY_INTERVAL);

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [error, retryCount, fetchData]);

  if (loading) return <SkeletonHome />;

  if (error) {
    return (
      <div style={{ position: 'relative' }}>
        <SkeletonHome />

        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(18,18,30,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '32px', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 50, whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            border: '2px solid rgba(232,83,29,0.25)',
            borderTopColor: '#e8531d',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {retryCount >= MAX_RETRIES ? 'Gagal terhubung ke server' : 'Server pemanasan...'}
          </span>
          {retryCount >= MAX_RETRIES && (
            <button
              onClick={() => { setRetryCount(0); setError(true); }}
              style={{
                background: '#e8531d', color: '#fff',
                border: 'none', borderRadius: '16px',
                padding: '5px 12px', fontSize: '0.75rem',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Coba lagi
            </button>
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { newReleases, recommended, dubDramas } = data!;
  const heroItems = [...newReleases.slice(0, 3), ...recommended.slice(0, 3)].slice(0, 6);

  return (
    <div>
      {heroItems.length > 0 && <HeroCarousel items={heroItems} />}

      {newReleases.length > 0 && (
        <DramaSection title="Rilis Baru" items={newReleases.slice(0, 12)} seeAllHref="/browse?shelf=newrelease" delay={1} />
      )}
      {recommended.length > 0 && (
        <DramaSection title="Rekomendasi" items={recommended.slice(0, 12)} seeAllHref="/browse?shelf=recommend" delay={2} />
      )}
      {dubDramas.length > 0 && (
        <DramaSection title="Drama Dub" items={dubDramas.slice(0, 12)} seeAllHref="/browse?shelf=dramadub" delay={3} />
      )}

      <footer style={{ padding: '32px 20px 8px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.3px' }}>
          ReelShort © 2026 · Powered by ReelShort
        </p>
      </footer>
    </div>
  );
}
