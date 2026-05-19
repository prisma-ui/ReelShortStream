'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { Drama, getCoverImage } from '@/lib/api';

interface Props { item: Drama; }

export default function DramaCard({ item }: Props) {
  const href = `/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`;
  const cover = getCoverImage(item);

  return (
    <div className="drama-card" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0 }}>
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>

        {/* Cover image */}
        <div style={{ position: 'relative', paddingBottom: '140%', background: 'var(--bg-hover)' }}>
          <Image src={cover} alt={item.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 480px) 38vw, 160px" />

          {/* Hover overlay */}
          <div className="card-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px' }}>
            <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff', fontSize: '0.72rem', fontWeight: 800, width: '100%', justifyContent: 'center', letterSpacing: '0.3px', boxShadow: '0 4px 16px rgba(232,51,42,0.5)' }}>
              <Play size={11} fill="#fff" strokeWidth={0} /> Tonton
            </button>
          </div>

          {/* Episode badge */}
          {item.episode_count && (
            <div className="episode-badge" style={{ position: 'absolute', top: '8px', right: '8px' }}>
              {item.episode_count} EP
            </div>
          )}

          {/* Bottom gradient fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, transparent, rgba(8,8,16,0.7))' }} />
        </div>

        {/* Title */}
        <div style={{ padding: '8px 10px 11px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.1px' }}>
            {item.title}
          </p>
        </div>
      </Link>
    </div>
  );
}
