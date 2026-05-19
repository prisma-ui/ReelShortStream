'use client'
import HeroCarousel from '@/components/HeroCarousel';
import DramaSection from '@/components/DramaSection';
import {
  getDramaDub,
  getNewRelease,
  getRecommended,
  bookToDrama,
  Drama,
} from '@/lib/api';

export const revalidate = 60;

export default async function HomePage() {
  let dubDramas: Drama[] = [];
  let newReleases: Drama[] = [];
  let recommended: Drama[] = [];

  try {
    const [dubRes, newRes, recRes] = await Promise.allSettled([
      getDramaDub(),
      getNewRelease(),
      getRecommended(),
    ]);

    if (dubRes.status === 'fulfilled') dubDramas = dubRes.value.books.map(bookToDrama);
    if (newRes.status === 'fulfilled') newReleases = newRes.value.books.map(bookToDrama);
    if (recRes.status === 'fulfilled') recommended = recRes.value.books.map(bookToDrama);
  } catch (e) {
    console.error('Failed to fetch home data', e);
  }

  const heroItems = [
    ...newReleases.slice(0, 3),
    ...recommended.slice(0, 3),
  ].slice(0, 6);

  return (
    <div>
      {heroItems.length > 0 ? (
        <HeroCarousel items={heroItems} />
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Memuat Konten...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Menghubungkan ke ReelShort API</p>
        </div>
      )}

      {newReleases.length > 0 && (
        <DramaSection title="Rilis Baru" items={newReleases.slice(0, 12)} seeAllHref="/browse?shelf=newrelease" />
      )}
      {recommended.length > 0 && (
        <DramaSection title="Direkomendasikan" items={recommended.slice(0, 12)} seeAllHref="/browse?shelf=recommend" />
      )}
      {dubDramas.length > 0 && (
        <DramaSection title="Drama Dub" items={dubDramas.slice(0, 12)} seeAllHref="/browse?shelf=dramadub" />
      )}

      <footer style={{ padding: '32px 20px 8px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          ReelShort © 2026 · Powered by ReelShort
        </p>
      </footer>
    </div>
  );
}
