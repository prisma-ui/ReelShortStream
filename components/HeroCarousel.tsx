'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ChevronRight } from 'lucide-react';
import { Drama, getCoverImage } from '@/lib/api';

interface Props { items: Drama[]; }

export default function HeroCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (transitioning || idx === current) return;
    setTransitioning(true);
    setPrev(current);
    setCurrent(idx);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 500);
  }, [current, transitioning]);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => goTo((current + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [current, items.length, goTo]);

  if (!items.length) return null;
  const item = items[current];
  const href = `/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`;

  return (
    <div style={{ position: 'relative', height: '460px', overflow: 'hidden', marginBottom: '8px' }}>

      {/* Prev frame fading out */}
      {prev !== null && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0, transition: 'opacity 0.5s ease' }}>
          <Image src={getCoverImage(items[prev])} alt="" fill style={{ objectFit: 'cover', objectPosition: 'center top' }} />
        </div>
      )}

      {/* Current frame */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: transitioning ? 0 : 1, transition: 'opacity 0.5s ease', transform: transitioning ? 'scale(1.03)' : 'scale(1)', transitionProperty: 'opacity, transform' }}>
        <Image src={getCoverImage(item)} alt={item.title} fill style={{ objectFit: 'cover', objectPosition: 'center top' }} priority />

        {/* Multi-layer gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(8,8,16,0.95) 0%, rgba(8,8,16,0.55) 45%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,16,0.3) 0%, transparent 35%, transparent 55%, rgba(8,8,16,0.98) 100%)' }} />
      </div>

      {/* Top: live badge */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(232,51,42,0.15)', border: '1px solid rgba(232,51,42,0.3)', borderRadius: '20px', padding: '3px 10px 3px 8px', fontSize: '0.65rem', fontWeight: 700, color: '#ff6b63', letterSpacing: '0.5px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8332a', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
          SEDANG TAYANG
        </span>
      </div>

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 28px', maxWidth: '340px', zIndex: 10 }}>

        {/* Episode count pill */}
        {item.episode_count && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '10px', letterSpacing: '0.3px' }}>
            {item.episode_count} Episode
          </div>
        )}

        <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '10px', letterSpacing: '-0.5px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          {item.title}
        </h1>

        {item.description && (
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: '#fff', padding: '11px 22px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.2px', boxShadow: '0 4px 20px rgba(232,51,42,0.4)' }}>
            <Play size={14} fill="#fff" strokeWidth={0} /> Tonton
          </Link>
          <Link href={`/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', padding: '11px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Detail <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Right: thumbnail stack */}
      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '7px', zIndex: 10 }}>
        {items.slice(0, 5).map((it, i) => (
          <button key={it.id} onClick={() => goTo(i)} style={{ width: '50px', height: '66px', borderRadius: '8px', overflow: 'hidden', border: i === current ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.07)', cursor: 'pointer', position: 'relative', opacity: i === current ? 1 : 0.45, transition: 'all 0.3s ease', transform: i === current ? 'scale(1.08)' : 'scale(1)', padding: 0, boxShadow: i === current ? '0 4px 16px rgba(232,51,42,0.4)' : 'none' }}>
            <Image src={getCoverImage(it)} alt={it.title} fill style={{ objectFit: 'cover' }} />
          </button>
        ))}
      </div>

      {/* Bottom dots */}
      <div style={{ position: 'absolute', bottom: '10px', right: '76px', display: 'flex', gap: '5px', zIndex: 10 }}>
        {items.slice(0, 6).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 18 : 5, height: 5, borderRadius: '3px', background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}
