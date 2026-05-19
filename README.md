# ReelShort Stream

Website streaming drama pendek berbasis [ReelShort](https://reelshort.com), dibangun dengan Next.js 15 dan terhubung ke ReelShort API.

## Fitur

- 🎬 Browse drama dari shelf: Rilis Baru, Direkomendasikan, Drama Dub
- 🔍 Pencarian drama real-time
- 📺 Player video per episode dengan navigasi episode berikutnya
- 🔒 API URL tersembunyi — semua request lewat proxy internal Next.js
- 📱 Tampilan mobile-first

## Struktur Halaman

| Route | Halaman |
|---|---|
| `/` | Beranda — hero carousel + section drama |
| `/browse` | Jelajahi drama per kategori shelf |
| `/search` | Pencarian drama |
| `/drama/[bookId]` | Detail drama + daftar episode |
| `/watch/[bookId]/[episodeNum]` | Player video episode |

## Setup Lokal

```bash
# Install dependencies
npm install

# Buat file .env.local
cp .env.example .env.local

# Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Keterangan |
|---|---|
| `REELSHORT_API_URL` | URL base API ReelShort (wajib di production) |

Nilai default jika tidak di-set: `https://reelshortapi.onrender.com`

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan environment variable di **Project Settings → Environment Variables**:
   ```
   REELSHORT_API_URL = https://reelshortapi.onrender.com
   ```
4. Klik **Deploy**

## Stack

- [Next.js 15](https://nextjs.org) — App Router
- [TypeScript](https://typescriptlang.org)
- [Lucide React](https://lucide.dev) — Icons
- [ReelShort API](https://google.com) — Data source
