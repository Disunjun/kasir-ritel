# KasirRitel

KasirRitel adalah aplikasi POS retail modern berbasis Next.js + Supabase, dibuat sesuai PRD dan task breakdown yang sudah disusun.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres + Auth
- Recharts
- Lucide React
- Zod validation

## Local development

```bash
npm install
npm run dev
```

Akses: http://localhost:3000

## Production build

```bash
npm run build
npm run start
```

## Deployment checklist (Vercel)

1. Push repository ke GitHub.
2. Import project ke Vercel.
3. Set environment variables berikut:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=product-images
```

4. Pastikan project Supabase sudah menjalankan `supabase/schema.sql`.
5. Jalankan `supabase/seed.sql` untuk mengisi data development gudang, kategori, produk, dan stok.
6. Pastikan storage bucket `product-images` sudah dibuat dan policy sesuai kebutuhan.
7. Deploy.

## Production hardening notes

- `next.config.ts` menggunakan `output: "standalone"` untuk deployment serverless/container-friendly.
- Security headers diaktifkan pada semua route.
- Route privat admin/kasir dibatasi dengan middleware dan role guard.
- Build wajib diuji dengan `npm run build` sebelum publish.
