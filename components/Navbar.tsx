'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

export default function Navbar() {
  const path = usePathname();
  const isWatch = path.startsWith('/watch');

  if (isWatch) return null;

  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '52px', background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 100, gap: '12px' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flex: 1 }}>
        <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: '#fff' }}>RS</div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
          Reel<span style={{ color: 'var(--accent)' }}>Short</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '4px' }}>
        <Link href="/search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <Search size={18} />
        </Link>
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
