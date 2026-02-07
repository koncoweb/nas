# 🚀 Panduan Deployment ke Vercel

## 📋 Checklist Sebelum Deploy

- [ ] Database Neon PostgreSQL sudah dibuat
- [ ] Environment variables sudah disiapkan
- [ ] Code sudah di-push ke GitHub
- [ ] Styling update sudah di-test lokal

## 🎯 Root Directory Setting

### PENTING: Root Directory
```
apps/web
```

**BUKAN** root project utama! Pilih folder `apps/web` sebagai root directory.

## 🔧 Vercel Project Settings

### 1. Framework Preset
```
Other
```
Atau pilih "React Router" jika tersedia.

### 2. Build Settings

#### Build Command
```bash
npm run build
```

Atau jika ada error:
```bash
node vercel-build.js
```

#### Output Directory
```
build/client
```

#### Install Command
```bash
npm install
```

#### Development Command (Optional)
```bash
npm run dev
```

### 3. Root Directory
```
apps/web
```

⚠️ **SANGAT PENTING**: Pastikan ini diset dengan benar!

## 🔐 Environment Variables

Tambahkan di Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```env
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://username:password@host.region.neon.tech/dbname?sslmode=require

# Authentication Secret (REQUIRED - min 32 characters)
AUTH_SECRET=your-very-long-secret-key-minimum-32-characters-here

# CORS Origins (REQUIRED)
CORS_ORIGINS=https://your-app-name.vercel.app

# Node Environment
NODE_ENV=production
```

### Optional Variables (Create.xyz Integration)

```env
NEXT_PUBLIC_CREATE_BASE_URL=https://api.create.xyz
NEXT_PUBLIC_CREATE_HOST=create.xyz
NEXT_PUBLIC_PROJECT_GROUP_ID=your-project-id
```

## 📝 Step-by-Step Deployment

### Step 1: Persiapan Database

1. **Buat Neon Database**
   - Kunjungi: https://neon.tech
   - Create new project
   - Copy connection string

2. **Format Connection String**
   ```
   postgresql://username:password@host.region.neon.tech/dbname?sslmode=require
   ```

### Step 2: Push ke GitHub

```bash
git add .
git commit -m "Ready for deployment with modern blue theme"
git push origin main
```

### Step 3: Import ke Vercel

1. **Login ke Vercel**
   - Kunjungi: https://vercel.com
   - Login dengan GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   
   **Root Directory:**
   ```
   apps/web
   ```
   ⚠️ Klik "Edit" dan set ke `apps/web`

   **Framework Preset:**
   ```
   Other
   ```

   **Build Command:**
   ```
   npm run build
   ```

   **Output Directory:**
   ```
   build/client
   ```

   **Install Command:**
   ```
   npm install
   ```

4. **Add Environment Variables**
   
   Klik "Environment Variables" dan tambahkan:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `CORS_ORIGINS`
   - `NODE_ENV`

5. **Deploy**
   
   Click "Deploy" button

### Step 4: Verifikasi Deployment

1. **Check Build Logs**
   - Pastikan tidak ada error
   - Migration harus sukses

2. **Test Application**
   - Buka URL deployment
   - Test login dengan demo account
   - Verify styling (blue theme)

3. **Check Database**
   - Verify tables created
   - Check demo data

## 🔍 Troubleshooting

### Error: "Root directory not found"

**Solution:**
```
Set Root Directory to: apps/web
```

### Error: "Build failed"

**Solution 1:** Check build command
```bash
npm run build
```

**Solution 2:** Use custom build script
```bash
node vercel-build.js
```

### Error: "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` format
2. Ensure `?sslmode=require` at the end
3. Verify Neon database is active

### Error: "AUTH_SECRET not set"

**Solution:**
Generate new secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Error: "CORS error"

**Solution:**
Update `CORS_ORIGINS`:
```
https://your-actual-domain.vercel.app
```

## 📊 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Blue theme is visible
- [ ] Login works with demo accounts
- [ ] Database queries work
- [ ] API endpoints respond
- [ ] No console errors
- [ ] Mobile responsive works
- [ ] All pages accessible

## 🔄 Redeployment

### Trigger Redeploy

1. **From Vercel Dashboard:**
   - Go to Deployments
   - Click "..." → "Redeploy"

2. **From Git:**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### Update Environment Variables

1. Go to Settings → Environment Variables
2. Edit variable
3. Redeploy for changes to take effect

## 🎨 Styling Verification

After deployment, verify:

- [ ] Primary blue color (#2563eb) visible
- [ ] Accent blue color (#0ea5e9) visible
- [ ] Neutral gray backgrounds
- [ ] Line-style icons
- [ ] Smooth transitions
- [ ] Hover effects work

## 📞 Support

### Documentation
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Detailed guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist
- [VERCEL_READY.md](./VERCEL_READY.md) - Vercel-specific info

### Common Issues
- Check build logs in Vercel dashboard
- Verify environment variables
- Test database connection
- Check CORS settings

## 🎯 Quick Reference

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework | Other |
| Build Command | `npm run build` |
| Output Directory | `build/client` |
| Install Command | `npm install` |
| Node Version | 20.x |

---

**Ready to Deploy?** Follow the steps above! 🚀

**Need Help?** Check [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for more details.
