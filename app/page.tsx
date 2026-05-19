'use client';
import { useState, useEffect } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import DramaSection from '@/components/DramaSection';
import {
  getDramaDub,
  getNewRelease,
  getRecommended,
  bookToDrama,
  Drama,
} from '@/lib/api';

export default function HomePage() {
  const [dubDramas, setDubDramas] = useState<Drama[]>([]);
  const [newReleases, setNewReleases] = useState<Drama[]>([]);
  const [recommended, setRecommended] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getDramaDub(), getNewRelease(), getRecommended()])
      .then(([dubRes, newRes, recRes]) => {
        if (dubRes.status === 'fulfilled') setDubDramas(dubRes.value.books.map(bookToDrama));
        if (newRes.status === 'fulfilled') setNewReleases(newRes.value.books.map(bookToDrama));
        if (recRes.status === 'fulfilled') setRecommended(recRes.value.books.map(bookToDrama));
      })
      .finally(() => setLoading(false));
  }, []);

  const heroItems = [...newReleases.slice(0, 3), ...recommended.slice(0, 3)].slice(0, 6);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Memuat Konten...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Menghubungkan ke ReelShort API</p>
      </div>
    );
  }

  return (
    <div>
      {heroItems.length > 0 ? (
        <HeroCarousel items={heroItems} />
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Tidak ada konten</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gagal memuat data dari API</p>
        </div>
      )}

      {newReleases.length > 0 && (
        <DramaSection title="Rilis Baru 💥" items={newReleases.slice(0, 12)} seeAllHref="/browse?shelf=newrelease" />
      )}
      {recommended.length > 0 && (
        <DramaSection title="Lebih Direkomendasikan 🔍" items={recommended.slice(0, 12)} seeAllHref="/browse?shelf=recommend" />
      )}
      {dubDramas.length > 0 && (
        <DramaSection title="Drama dengan Dub 🎧" items={dubDramas.slice(0, 12)} seeAllHref="/browse?shelf=dramadub" />
      )}

      <footer style={{ padding: '32px 20px 8px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          ReelShort © 2024 · Powered by ReelShort API
        </p>
      </footer>
    </div>
  );
}
