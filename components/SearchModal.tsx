'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { searchDramas, searchResultToDrama, Drama, getCoverImage } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else { setQuery(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const raw = await searchDramas(query);
        setResults(raw.map(searchResultToDrama));
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', flexDirection: 'column' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
        <Search size={18} color="var(--text-muted)" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari drama..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem' }}
        />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '20px' }}>Mencari...</p>}
        {!loading && results.map(item => {
          const href = `/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`;
          return (
            <Link key={item.id} href={href} onClick={onClose} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
              <div style={{ width: 48, height: 64, borderRadius: '6px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <Image src={getCoverImage(item)} alt={item.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>{item.title}</p>
                {item.episode_count && <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.episode_count} episode</p>}
              </div>
            </Link>
          );
        })}
        {!loading && query && results.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '20px' }}>Tidak ada hasil</p>
        )}
      </div>
    </div>
  );
}
