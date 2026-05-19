import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'ReelShort - Drama Pendek Seru!',
  description: 'Tonton drama pendek terbaik tanpa iklan. Update setiap hari!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ paddingTop: '56px', paddingBottom: '64px', minHeight: '100vh' }}>
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
