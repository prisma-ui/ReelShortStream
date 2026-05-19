import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import DramaCard from './DramaCard';
import { Drama } from '@/lib/api';

interface Props {
  title: string;
  items: Drama[];
  seeAllHref?: string;
}

export default function DramaSection({ title, items, seeAllHref }: Props) {
  if (!items.length) return null;
  return (
    <section style={{ padding: '24px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '14px' }}>
        <h2 className="section-title">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Lihat Semua <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="scroll-x" style={{ padding: '0 16px', display: 'flex', gap: '12px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ width: '140px' }}>
            <DramaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
