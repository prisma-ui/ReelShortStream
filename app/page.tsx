import { Suspense } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import DramaSection from '@/components/DramaSection';
import SkeletonHome from '@/components/SkeletonHome';
import { getDramaDub, getNewRelease, getRecommended, bookToDrama, Drama } from '@/lib/api';

async function HomeContent() {
  const [dubRes, newRes, recRes] = await Promise.allSettled([
    getDramaDub(),
    getNewRelease(),
    getRecommended(),
  ]);

  const dubDramas: Drama[] = dubRes.status === 'fulfilled' && dubRes.value.books?.length > 0
    ? dubRes.value.books.map(bookToDrama) : [];
  const newReleases: Drama[] = newRes.status === 'fulfilled' && newRes.value.books?.length > 0
    ? newRes.value.books.map(bookToDrama) : [];
  const recommended: Drama[] = recRes.status === 'fulfilled' && recRes.value.books?.length > 0
    ? recRes.value.books.map(bookToDrama) : [];

  const heroItems = [...newReleases.slice(0, 3), ...recommended.slice(0, 3)].slice(0, 6);
  const hasAnyData = newReleases.length > 0 || recommended.length > 0 || dubDramas.length > 0;

  if (!hasAnyData) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
          Gagal Memuat Konten
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '12px' }}>
          Tidak dapat terhubung ke API. Server mungkin sedang cold start (30–60 detik pertama).
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '24px' }}>
          Pastikan <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>REELSHORT_API_URL</code> di{' '}
          <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code> sudah benar dan API aktif.
        </p>
        {/* Gunakan meta refresh sebagai fallback — tidak butuh 'use client' */}
        <a
          href="/"
          style={{
            display: 'inline-block',
            background: '#e8531d',
            color: '#fff',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          🔄 Coba Lagi
        </a>
      </div>
    );
  }

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

      {hasAnyData && (
        <footer style={{ padding: '32px 20px 8px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.3px' }}>
            ReelShort © 2026 · Powered by ReelShort
          </p>
        </footer>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonHome />}>
      <HomeContent />
    </Suspense>
  );
}
