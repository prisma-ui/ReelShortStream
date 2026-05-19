'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/browse', label: 'Jelajahi', icon: Grid },
  { href: '/search', label: 'Cari', icon: Search },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100 }}>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== '/' && path.startsWith(href));
        return (
          <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', textDecoration: 'none', color: active ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
