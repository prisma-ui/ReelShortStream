/**
 * Layout khusus untuk /watch/[bookId]/[episodeNum]
 * File ini ditempatkan di: app/watch/layout.tsx
 *
 * Tujuan: override root layout agar halaman watch
 * tidak punya paddingTop (navbar) dan paddingBottom (bottom nav),
 * sehingga video bisa full-screen dari ujung ke ujung.
 */
export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
