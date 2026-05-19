import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import DramaCard from './DramaCard';
import { Drama } from '@/lib/api';

interface Props {
  title: string;
  items: Drama[];
  seeAllHref?: string;
  delay?: number;
}

export default function DramaSection({ title, items, seeAllHref, delay = 0 }: Props) {
  if (!items.length) return null;

  const delayClass = delay === 1 ? 'fade-up-d1' : delay === 2 ? 'fade-up-d2' : delay === 3 ? 'fade-up-d3' : '';

  return (
    <section className={`fade-up ${delayClass}`} style={{ padding: '20px 0 6px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="section-title-accent" />
          <h2 className="section-title">{title}</h2>
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="see-all-btn">
            Semua <ChevronRight size={13} />
          </Link>
        )}
      </div>

      {/* Cards scroll row */}
      <div className="scroll-x" style={{ padding: '4px 16px 8px', display: 'flex', gap: '10px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ width: '130px', flexShrink: 0 }}>
            <DramaCard item={item} />
          </div>
        ))}
      </div>

    </section>
  );
}
