# NAS Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure Environment Variables

Copy the example file and fill in your values:

```bash
# The .env.local file already exists, just fill in the values
```

Edit `nas/.env.local` and add:

```bash
# 1. Get your Neon database URL
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. Generate a secret key (run this command):
#    PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
#    Linux/Mac: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here"

# 3. Set the URL (use localhost for development)
NEXTAUTH_URL="http://localhost:3000"
```

### Step 2: Install Dependencies

```bash
cd nas
npm install
```

### Step 3: Verify Setup

```bash
# Run the verification script
node verify-foundation.js
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 - you should be redirected to the login page.

### Step 5: Test Database Connection

Open http://localhost:3000/api/test-db in your browser.

You should see:
```json
{
  "connected": true,
  "message": "Database connection successful",
  "tables": [...],
  "userCount": 1
}
```

### Step 6: Test Authentication

1. Go to http://localhost:3000/login
2. Enter credentials from your `auth_users` table
3. You should be redirected to `/dashboard` on successful login

## 🚀 Deploy to Vercel

### Quick Deploy

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
cd nas
vercel

# Add environment variables when prompted
# Then deploy to production
vercel --prod
```

### Or Deploy via Dashboard

1. Go to https://vercel.com/new
2. Import your repository
3. Set root directory to `nas`
4. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (use your Vercel URL)
5. Click Deploy

## 🧪 Verify Everything Works

```bash
# 1. Build test
npm run build

# 2. Foundation verification
node verify-foundation.js

# 3. Start dev server
npm run dev

# 4. Test database (in browser)
http://localhost:3000/api/test-db

# 5. Test login (in browser)
http://localhost:3000/login
```

## 📋 Troubleshooting

### "DATABASE_URL is not set"
- Check that `.env.local` exists in the `nas` folder
- Verify the DATABASE_URL value is not empty
- Restart the dev server after changing environment variables

### "Database connection failed"
- Verify your Neon database is running
- Check the connection string is correct
- Ensure your IP is allowed in Neon's connection settings

### "Authentication error"
- Verify `auth_users` table has at least one user
- Check that `auth_accounts` table has a password for that user
- Ensure the password is hashed with argon2

### Build fails
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npx tsc --noEmit`
- Clear Next.js cache: `rm -rf .next`

## 📚 What's Included

- ✅ Next.js 14+ with App Router
- ✅ TypeScript
- ✅ Tailwind CSS (indigo theme)
- ✅ shadcn/ui components
- ✅ NextAuth.js authentication
- ✅ Neon PostgreSQL integration
- ✅ Protected routes with middleware
- ✅ Dashboard layout with sidebar
- ✅ Reusable data table component
- ✅ Form validation with Zod
- ✅ Vercel deployment ready

## 🎯 Next Steps

Once the foundation is verified:

1. ✅ Task 1: Project initialization ✓
2. ✅ Task 2: Database and authentication ✓
3. ✅ Task 3: Core UI components ✓
4. ✅ Task 4: Verify foundation ✓
5. ⏭️ Task 5: Customer management feature (NEXT)

See `.kiro/specs/nas-rebuild/tasks.md` for the full implementation plan.
