'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DramaCard from '@/components/DramaCard';
import { searchDramas, searchResultToDrama, Drama } from '@/lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const raw = await searchDramas(query);
        setResults(raw.map(searchResultToDrama));
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>Cari Drama</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px' }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari judul drama..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
        />
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer" style={{ paddingBottom: '133%', borderRadius: '10px' }} />)}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
          {results.map(item => (
            <DramaCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Search size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p>Tidak ada hasil untuk &ldquo;<strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>&rdquo;</p>
        </div>
      )}

      {!query && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Search size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p>Ketik sesuatu untuk mulai mencari</p>
        </div>
      )}
    </div>
  );
}
