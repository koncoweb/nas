# Deployment Guide - Vercel

## Prerequisites

1. **Neon Database**: Create a PostgreSQL database at [Neon Console](https://console.neon.tech/)
2. **Vercel Account**: Sign up at [Vercel](https://vercel.com/)
3. **GitHub Repository**: Push your code to GitHub

## Step 1: Database Setup

### 1.1 Create Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string from the dashboard
4. Make sure to use the **pooled connection** string for production

### 1.2 Run Database Migrations
```bash
# Install dependencies
npm install

# Run migrations to set up database schema
npm run migrate
```

## Step 2: Environment Variables Setup

### 2.1 Generate AUTH_SECRET
```bash
# Generate a secure random string
openssl rand -base64 32
```

### 2.2 Required Environment Variables
Copy `.env.example` to `.env` and fill in the values:

```env
# Database (from Neon dashboard)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Authentication (generated above)
AUTH_SECRET=your-generated-secret-here

# CORS (add your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:4000

# Create Integration (your Vercel domain)
NEXT_PUBLIC_CREATE_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_CREATE_HOST=your-app.vercel.app
NEXT_PUBLIC_PROJECT_GROUP_ID=nas2-project
```

## Step 3: Vercel Deployment

### 3.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `apps/web` folder as the root directory

### 3.2 Configure Build Settings
- **Framework Preset**: Other
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `build/client`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables
In Vercel project settings, add these environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Neon database connection string |
| `AUTH_SECRET` | `your-secret` | Authentication secret key |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Allowed CORS origins |
| `NEXT_PUBLIC_CREATE_BASE_URL` | `https://your-app.vercel.app` | Public base URL |
| `NEXT_PUBLIC_CREATE_HOST` | `your-app.vercel.app` | Public host |
| `NEXT_PUBLIC_PROJECT_GROUP_ID` | `nas2-project` | Project group ID |
| `NODE_ENV` | `production` | Node environment |

### 3.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-app.vercel.app`

## Step 4: Post-Deployment Setup

### 4.1 Update CORS Origins
After deployment, update your environment variables:
```env
CORS_ORIGINS=https://your-actual-domain.vercel.app,http://localhost:4000
NEXT_PUBLIC_CREATE_BASE_URL=https://your-actual-domain.vercel.app
NEXT_PUBLIC_CREATE_HOST=your-actual-domain.vercel.app
```

### 4.2 Test the Application
1. Visit your deployed URL
2. Test user authentication
3. Test API endpoints
4. Verify database connectivity

## Step 5: Database Seeding (Optional)

### 5.1 Create Demo Users
Run this SQL in your Neon database console:

```sql
-- Create demo users
INSERT INTO auth_users (id, name, email, password_hash, user_role) VALUES
('demo-leader-1', 'Demo Leader', 'leader@demo.com', '$argon2id$v=19$m=65536,t=3,p=4$hash', 'leader'),
('demo-sales-1', 'Demo Sales', 'sales@demo.com', '$argon2id$v=19$m=65536,t=3,p=4$hash', 'sales'),
('demo-engineer-1', 'Demo Engineer', 'engineer@demo.com', '$argon2id$v=19$m=65536,t=3,p=4$hash', 'engineer'),
('demo-accounting-1', 'Demo Accounting', 'accounting@demo.com', '$argon2id$v=19$m=65536,t=3,p=4$hash', 'accounting');

-- Password for all demo accounts: password123
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run build  # Test locally first
npm run typecheck  # Fix TypeScript errors
```

#### 2. Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure database is accessible from Vercel
- Check Neon database is not paused

#### 3. Authentication Issues
- Verify AUTH_SECRET is set
- Check CORS_ORIGINS includes your domain
- Ensure cookies are working (HTTPS required)

#### 4. API Route Errors
- Check Vercel function logs
- Verify environment variables are set
- Test API endpoints individually

### Performance Optimization

#### 1. Database Connection Pooling
Neon automatically handles connection pooling. Use the pooled connection string:
```
postgresql://username:password@host-pooler.region.aws.neon.tech/database
```

#### 2. Static Asset Caching
Assets are automatically cached by Vercel with the current configuration.

#### 3. API Route Optimization
- Use proper HTTP status codes
- Implement request validation
- Add response caching where appropriate

### Security Checklist

- ✅ DATABASE_URL uses SSL (`sslmode=require`)
- ✅ AUTH_SECRET is cryptographically secure
- ✅ CORS_ORIGINS is properly configured
- ✅ Environment variables are not exposed to client
- ✅ API routes have proper authentication
- ✅ Input validation is implemented
- ✅ SQL injection protection is in place

## Monitoring and Maintenance

### 1. Vercel Analytics
Enable Vercel Analytics in your project settings for performance monitoring.

### 2. Database Monitoring
Monitor your Neon database usage in the Neon console.

### 3. Error Tracking
Consider adding error tracking service like Sentry for production monitoring.

### 4. Backup Strategy
Neon provides automatic backups. Consider setting up additional backup procedures for critical data.

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Neon database logs
3. Test API endpoints with tools like Postman
4. Verify environment variables are correctly set

For additional help:
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [React Router Documentation](https://reactrouter.com/)