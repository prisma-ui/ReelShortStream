'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGenres, type GenreItem } from '@/lib/api';
import { Film, Loader2, ChevronRight } from 'lucide-react';

// Warna berdasarkan posisi (karena genre dari API tidak punya warna)
const PALETTE = [
  '#e85d04','#c1121f','#0077b6','#1b4332',
  '#7b2d8b','#f4a261','#6a0572','#370617',
  '#023e8a','#d62828','#2d6a4f','#9d4edd',
];

function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export default function GenrePage() {
  const router = useRouter();
  const [genres, setGenres]   = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    const data = await getGenres();
    setLoading(false);
    if (data.genres.length > 0) setGenres(data.genres);
    else setError('Gagal memuat daftar genre. Coba lagi.');
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 12px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <Film size={20} color="var(--accent)" />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Genre</h1>
        {genres.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            padding: '2px 10px', borderRadius: '20px',
          }}>{genres.length} genre</span>
        )}
      </div>

      <div style={{ padding: '4px 16px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <Film size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ marginBottom: '16px' }}>{error}</p>
            <button onClick={load} style={{
              padding: '9px 22px', borderRadius: '22px', background: 'var(--accent)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', border: 'none',
            }}>Coba Lagi</button>
          </div>
        )}

        {!loading && genres.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '10px',
          }}>
            {genres.map((genre, idx) => {
              const color = paletteColor(idx);
              // slug untuk routing: genre_id + "-movies" sesuai pola URL ReelShort
              const routeSlug = `${genre.genre_id}-movies`;
              return (
                <button
                  key={genre.genre_id}
                  onClick={() => router.push(`/genre/${routeSlug}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '14px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                    (e.currentTarget as HTMLButtonElement).style.background = `${color}12`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                  }}
                >
                  {/* Ikon huruf pertama genre */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                    background: `${color}22`, border: `1.5px solid ${color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 900, color,
                  }}>
                    {genre.name.trim()[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)',
                      lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{genre.name}</p>
                    {(genre.book_count ?? 0) > 0 && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {genre.book_count} drama
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
