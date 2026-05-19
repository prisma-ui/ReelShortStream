'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Share2 } from 'lucide-react';
import { Drama, getCoverImage } from '@/lib/api';

interface Props {
  items: Drama[];
}

export default function HeroCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      goTo((current + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [current, items.length]);

  function goTo(idx: number) {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 600);
  }

  if (!items.length) return null;
  const item = items[current];
  const href = `/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`;

  return (
    <div style={{ position: 'relative', height: '420px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transition: 'opacity 0.6s ease', opacity: animating ? 0.6 : 1 }}>
        <Image
          src={getCoverImage(item)}
          alt={item.title}
          fill
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.5) 40%, transparent 70%), linear-gradient(180deg, transparent 40%, rgba(10,10,15,0.95) 100%)' }} />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '8px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {item.title}
        </h1>
        {item.description && (
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        )}
        {item.episode_count && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: '12px' }}>{item.episode_count} Episode</p>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
            <Play size={15} fill="#fff" /> Tonton Sekarang
          </Link>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', color: '#fff' }}>
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div style={{ position: 'absolute', right: '16px', bottom: '24px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {items.slice(0, 5).map((it, i) => (
          <button
            key={it.id}
            onClick={() => goTo(i)}
            style={{ width: '52px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: i === current ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', position: 'relative', opacity: i === current ? 1 : 0.5, transition: 'all 0.3s', flexShrink: 0, padding: 0 }}
          >
            <Image src={getCoverImage(it)} alt={it.title} fill style={{ objectFit: 'cover' }} />
          </button>
        ))}
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
        {items.slice(0, 6).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: '3px', background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}
