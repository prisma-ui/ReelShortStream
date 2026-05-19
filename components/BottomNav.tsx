'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid, Tag, Film } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/browse', label: 'Jelajahi', icon: Grid },
  { href: '/genre', label: 'Genre', icon: Film },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/search', label: 'Cari', icon: Search },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/watch')) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '62px',
      background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', zIndex: 100
    }}>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== '/' && path.startsWith(href));
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '4px', textDecoration: 'none',
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'color 0.2s', position: 'relative'
          }}>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '32px', height: '2px', background: 'var(--accent)',
                borderRadius: '0 0 3px 3px', boxShadow: '0 0 8px var(--accent-glow)'
              }} />
            )}
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.6rem', fontWeight: active ? 800 : 500, letterSpacing: '0.2px' }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
