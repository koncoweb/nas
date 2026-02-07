# Vercel Deployment Guide

Complete guide for deploying the Marine Engineering Project Management System to Vercel.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Neon Database** - PostgreSQL database from [neon.tech](https://neon.tech)
3. **GitHub Repository** - Code hosted on GitHub (recommended)
4. **Node.js 20+** - For local testing

## Quick Start

### 1. Prepare Your Database

Create a Neon PostgreSQL database:

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:pass@host/db`)

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Other
   - **Build Command**: `node vercel-build.js`
   - **Output Directory**: `build/client`
   - **Install Command**: `npm install`

4. Add Environment Variables (see below)
5. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd apps/web
vercel

# Follow the prompts
```

### 3. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

#### Required Variables

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-here-min-32-chars

# CORS Origins (your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

#### Optional Variables

```env
# Create.xyz Integration (if using)
NEXT_PUBLIC_CREATE_BASE_URL=https://api.create.xyz
NEXT_PUBLIC_CREATE_HOST=your-host
NEXT_PUBLIC_PROJECT_GROUP_ID=your-project-id
```

## Build Process

The build process (`vercel-build.js`) performs these steps:

1. ✅ **Validate Environment** - Check required variables
2. ✅ **Install Dependencies** - Run `npm install`
3. ✅ **Run Migrations** - Execute database migrations
4. ✅ **Build Application** - Compile React Router app
5. ✅ **Create Function** - Generate Vercel serverless function
6. ✅ **Verify Build** - Check all artifacts exist

## Database Migrations

Migrations run automatically during build via `scripts/migrate.js`.

### Manual Migration

If migrations fail during build, run manually:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-connection-string"

# Run migrations
npm run migrate

# Verify schema
npm run migrate:verify
```

### Migration Troubleshooting

**Issue**: Migrations timeout during build
- **Solution**: Increase function timeout in `vercel.json` (already set to 60s)

**Issue**: Connection refused
- **Solution**: Check Neon database is accessible and connection string is correct

**Issue**: Permission denied
- **Solution**: Ensure database user has CREATE/ALTER permissions

## Vercel Configuration

### vercel.json

Key configurations:

```json
{
  "buildCommand": "npm run build && node scripts/migrate.js",
  "functions": {
    "api/index.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Function Limits

- **Timeout**: 60 seconds (configurable)
- **Memory**: 1024 MB (configurable)
- **Runtime**: Node.js 20.x

## Post-Deployment

### 1. Verify Deployment

Check these endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/test

# Database connection
curl https://your-app.vercel.app/api/dashboard/stats
```

### 2. Create Admin User

Access the application and create your first user:

1. Go to `https://your-app.vercel.app/account/signup`
2. Create an account
3. Manually update user role in database:

```sql
UPDATE auth_users 
SET user_role = 'leader' 
WHERE email = 'your-email@example.com';
```

### 3. Configure Demo Accounts (Optional)

See `DEMO_ACCOUNTS.md` for setting up demo users.

## Monitoring & Debugging

### View Logs

```bash
# Real-time logs
vercel logs your-app.vercel.app --follow

# Recent logs
vercel logs your-app.vercel.app
```

### Common Issues

#### 1. 500 Internal Server Error

**Symptoms**: Application loads but API calls fail

**Solutions**:
- Check Vercel function logs
- Verify DATABASE_URL is set correctly
- Ensure migrations completed successfully
- Check AUTH_SECRET is set

#### 2. Build Fails

**Symptoms**: Deployment fails during build

**Solutions**:
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version compatibility
- Check for syntax errors in code

#### 3. Database Connection Errors

**Symptoms**: "Connection refused" or timeout errors

**Solutions**:
- Verify Neon database is running
- Check connection string format
- Ensure `?sslmode=require` is in connection string
- Verify IP allowlist in Neon (should allow all for Vercel)

#### 4. Authentication Issues

**Symptoms**: Can't sign in or session errors

**Solutions**:
- Verify AUTH_SECRET is set and consistent
- Check CORS_ORIGINS matches your domain
- Clear browser cookies and try again
- Check auth_users table exists

## Performance Optimization

### 1. Enable Caching

Static assets are cached automatically via `vercel.json` headers.

### 2. Database Connection Pooling

Neon automatically handles connection pooling. No additional configuration needed.

### 3. Function Cold Starts

First request after inactivity may be slow (cold start). Subsequent requests are fast.

**Mitigation**:
- Use Vercel Pro for faster cold starts
- Implement health check pings
- Consider serverless-friendly architecture

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate AUTH_SECRET periodically
- ✅ Use strong database passwords

### 2. Database Security

- ✅ Enable SSL (already configured with `?sslmode=require`)
- ✅ Use Neon's IP allowlist if needed
- ✅ Regular backups (Neon provides automatic backups)
- ✅ Monitor for suspicious queries

### 3. Application Security

- ✅ CORS configured in `vercel.json`
- ✅ Security headers enabled
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation on all endpoints

## Scaling

### Automatic Scaling

Vercel automatically scales your application:
- **Serverless Functions**: Scale to zero when idle
- **Edge Network**: Global CDN for static assets
- **Database**: Neon autoscaling (on paid plans)

### Performance Monitoring

Monitor in Vercel Dashboard:
- Function execution time
- Error rates
- Bandwidth usage
- Build times

## Costs

### Vercel Pricing

- **Hobby**: Free (100GB bandwidth, 100 hours function time)
- **Pro**: $20/month (1TB bandwidth, 1000 hours function time)
- **Enterprise**: Custom pricing

### Neon Pricing

- **Free**: 0.5 GB storage, 1 compute unit
- **Pro**: $19/month, autoscaling, more storage
- **Enterprise**: Custom pricing

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Manual Deployments

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

## Rollback

If deployment fails or has issues:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

Or use Vercel Dashboard → Deployments → Promote to Production

## Support

### Resources

- [Vercel Documentation](https://vercel.com/docs)
- [React Router Documentation](https://reactrouter.com)
- [Neon Documentation](https://neon.tech/docs)

### Getting Help

1. Check Vercel function logs
2. Review build logs
3. Check database connection
4. Verify environment variables
5. Contact Vercel support (Pro/Enterprise)

## Checklist

Before deploying:

- [ ] Neon database created and accessible
- [ ] All environment variables configured
- [ ] Code pushed to GitHub
- [ ] Build tested locally
- [ ] Migrations tested
- [ ] `.vercelignore` configured
- [ ] `vercel.json` reviewed

After deploying:

- [ ] Verify application loads
- [ ] Test API endpoints
- [ ] Create admin user
- [ ] Configure demo accounts (optional)
- [ ] Set up monitoring
- [ ] Test authentication
- [ ] Verify database operations

## Next Steps

1. **Custom Domain**: Add your domain in Vercel settings
2. **SSL Certificate**: Automatic with Vercel
3. **Analytics**: Enable Vercel Analytics
4. **Monitoring**: Set up error tracking (Sentry, etc.)
5. **Backups**: Configure database backup strategy
6. **CI/CD**: Set up automated testing

---

**Ready to deploy?** Follow the Quick Start section above! 🚀