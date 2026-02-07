# Deployment Sederhana - Build Lokal

Karena masalah dengan build di Vercel, kita akan build lokal dan deploy hasilnya.

## Langkah 1: Build Lokal

```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

Pastikan aplikasi berjalan dengan baik di lokal (http://localhost:4000)

## Langkah 2: Build Production

```bash
npm run build
```

Ini akan membuat folder `build/` dengan:
- `build/client/` - static assets
- `build/server/` - server code

## Langkah 3: Deploy ke Vercel (Cara Manual)

### Opsi A: Deploy via Vercel CLI dengan Pre-built

1. Install Vercel CLI jika belum:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy (dari folder apps/web):
```bash
vercel --prod
```

Vercel akan mendeteksi bahwa folder `build/` sudah ada dan tidak perlu build lagi.

### Opsi B: Deploy ke Platform Lain

Karena aplikasi ini adalah Node.js server (bukan static), Anda bisa deploy ke:

1. **Railway.app** - Sangat mudah untuk Node.js apps
2. **Render.com** - Free tier tersedia
3. **Fly.io** - Bagus untuk full-stack apps
4. **DigitalOcean App Platform**

## Langkah 4: Environment Variables

Jangan lupa set environment variables di platform deployment:

```
DATABASE_URL=your_neon_connection_string
AUTH_SECRET=your_secret_min_32_chars
CORS_ORIGINS=https://your-domain.com
NODE_ENV=production
```

## Alternatif: Deploy dengan Docker

Jika mau lebih portable, saya bisa buatkan Dockerfile untuk deploy ke platform manapun yang support Docker.

## Rekomendasi Saya

**Railway.app** adalah yang paling mudah untuk aplikasi seperti ini:
1. Connect GitHub repo
2. Set environment variables
3. Deploy otomatis setiap push
4. Support Node.js dengan baik
5. Free tier cukup untuk testing

Mau saya buatkan konfigurasi untuk Railway?
