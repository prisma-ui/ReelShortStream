'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { Drama, getCoverImage } from '@/lib/api';

interface Props {
  item: Drama;
}

export default function DramaCard({ item }: Props) {
  const href = `/drama/${item.id}?filtered_title=${encodeURIComponent(item.filtered_title)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover_image || '')}`;
  const cover = getCoverImage(item);

  return (
    <div className="drama-card" style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0 }}>
      <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', paddingBottom: '133%', background: 'var(--bg-hover)' }}>
          <Image
            src={cover}
            alt={item.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 480px) 40vw, 200px"
            onError={() => {}}
          />
          <div className="card-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px' }}>
            <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '6px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff', fontSize: '0.72rem', fontWeight: 700, width: '100%', justifyContent: 'center' }}>
              <Play size={12} fill="#fff" /> Tonton
            </button>
          </div>
          {item.episode_count && (
            <div style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
              {item.episode_count} EP
            </div>
          )}
        </div>

        <div style={{ padding: '8px 10px 10px' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </p>
        </div>
      </Link>
    </div>
  );
}
