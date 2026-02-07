# ⚡ Quick Start Deployment

## 🎯 Root Directory

```
┌─────────────────────────────────────┐
│  Project Structure                  │
├─────────────────────────────────────┤
│  project-root/                      │
│  ├── apps/                          │
│  │   └── web/  ← SET THIS AS ROOT  │
│  │       ├── src/                   │
│  │       ├── package.json           │
│  │       ├── vercel.json            │
│  │       └── ...                    │
│  └── ...                            │
└─────────────────────────────────────┘
```

## 🚀 3 Langkah Deploy

### 1️⃣ Persiapan (5 menit)

```bash
# 1. Buat Neon Database
https://neon.tech → Create Project → Copy Connection String

# 2. Generate AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Push ke GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Vercel Setup (3 menit)

```
1. Login: https://vercel.com
2. Import Project → Select GitHub Repo
3. Configure:
   ┌──────────────────────────────────┐
   │ Root Directory: apps/web         │ ← PENTING!
   │ Framework: Other                 │
   │ Build Command: npm run build     │
   │ Output Directory: build/client   │
   └──────────────────────────────────┘
```

### 3️⃣ Environment Variables (2 menit)

```env
DATABASE_URL=postgresql://...?sslmode=require
AUTH_SECRET=your-64-character-hex-string
CORS_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
```

## ✅ Verification

Setelah deploy, check:
- ✅ Blue theme visible
- ✅ Login works
- ✅ Database connected
- ✅ No errors in console

## 🆘 Quick Fixes

### ❌ "Root directory not found"
```
Solution: Set Root Directory to "apps/web"
```

### ❌ "Build failed"
```
Solution: Check build logs, verify package.json
```

### ❌ "Database error"
```
Solution: Add ?sslmode=require to DATABASE_URL
```

### ❌ "CORS error"
```
Solution: Update CORS_ORIGINS with actual domain
```

## 📚 Full Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete guide
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Detailed steps
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist

---

**Total Time: ~10 minutes** ⏱️

**Difficulty: Easy** 😊
