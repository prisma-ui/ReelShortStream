'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function Navbar() {
  const path = usePathname();
  if (path.startsWith('/watch')) return null;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '54px',
      background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', padding: '0 16px',
      zIndex: 100, gap: '12px'
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flex: 1 }}>
        {/* Logo mark */}
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #e8332a 0%, #ff6b4a 100%)',
          borderRadius: '9px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '12px', color: '#fff',
          boxShadow: '0 4px 12px rgba(232,51,42,0.4)',
          letterSpacing: '-0.5px'
        }}>RS</div>
        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.5px', color: '#fff' }}>
          Reel<span style={{ color: '#e8332a' }}>Short</span>
        </span>
      </Link>

      <Link href="/search" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '38px', height: '38px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
        transition: 'all 0.2s'
      }}>
        <Search size={17} />
      </Link>
    </header>
  );
}
