# Vercel Deployment Checklist

Quick reference checklist for deploying to Vercel.

## Pre-Deployment

### 1. Database Setup
- [ ] Create Neon PostgreSQL database
- [ ] Copy connection string
- [ ] Test connection locally
- [ ] Verify database is accessible from internet

### 2. Environment Variables
- [ ] Generate AUTH_SECRET (min 32 chars)
- [ ] Prepare DATABASE_URL
- [ ] Note your Vercel domain for CORS_ORIGINS
- [ ] Review `.env.vercel.example` for all required vars

### 3. Code Preparation
- [ ] All changes committed to git
- [ ] Code pushed to GitHub
- [ ] No `.env` files in repository
- [ ] Build tested locally (`npm run build`)
- [ ] Migrations tested locally (`npm run migrate`)

### 4. Configuration Files
- [ ] `vercel.json` configured
- [ ] `package.json` has correct scripts
- [ ] `.vercelignore` exists
- [ ] `vercel-build.js` is executable

## Deployment Steps

### 1. Create Vercel Project
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import GitHub repository
- [ ] Select correct repository and branch

### 2. Configure Build Settings
- [ ] Framework Preset: **Other**
- [ ] Build Command: `node vercel-build.js`
- [ ] Output Directory: `build/client`
- [ ] Install Command: `npm install`
- [ ] Node.js Version: **20.x**

### 3. Add Environment Variables

Copy from `.env.vercel.example`:

#### Required
- [ ] `DATABASE_URL` - Neon connection string
- [ ] `AUTH_SECRET` - 32+ character secret
- [ ] `CORS_ORIGINS` - Your Vercel URL
- [ ] `NODE_ENV` - Set to `production`

#### Optional
- [ ] `NEXT_PUBLIC_CREATE_BASE_URL`
- [ ] `NEXT_PUBLIC_CREATE_HOST`
- [ ] `NEXT_PUBLIC_PROJECT_GROUP_ID`

### 4. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check build logs for errors
- [ ] Verify migrations ran successfully

## Post-Deployment

### 1. Verify Deployment
- [ ] Visit your Vercel URL
- [ ] Check homepage loads
- [ ] Test `/api/test` endpoint
- [ ] Verify no console errors

### 2. Database Verification
- [ ] Check `/api/dashboard/stats` returns data
- [ ] Verify all tables exist
- [ ] Run `npm run migrate:verify` locally

### 3. Create Admin User
- [ ] Go to `/account/signup`
- [ ] Create first user account
- [ ] Connect to database
- [ ] Update user role to 'leader':
  ```sql
  UPDATE auth_users 
  SET user_role = 'leader' 
  WHERE email = 'your-email@example.com';
  ```

### 4. Test Core Features
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Can create customer
- [ ] Can create quotation
- [ ] Can create project
- [ ] Can create material request
- [ ] Can create invoice

### 5. Configure Demo Accounts (Optional)
- [ ] Follow `DEMO_ACCOUNTS.md`
- [ ] Create demo users for each role
- [ ] Test each role's permissions

## Monitoring Setup

### 1. Vercel Dashboard
- [ ] Enable Analytics
- [ ] Set up error notifications
- [ ] Configure deployment notifications

### 2. Database Monitoring
- [ ] Check Neon dashboard
- [ ] Verify connection pooling
- [ ] Monitor query performance

### 3. Application Monitoring
- [ ] Test all major features
- [ ] Check function logs
- [ ] Monitor error rates

## Security Checklist

### 1. Environment Variables
- [ ] No secrets in code
- [ ] AUTH_SECRET is strong and unique
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] CORS_ORIGINS is set correctly

### 2. Database Security
- [ ] SSL enabled
- [ ] Strong database password
- [ ] Backups configured (Neon automatic)
- [ ] Connection pooling enabled

### 3. Application Security
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints

## Performance Checklist

### 1. Build Optimization
- [ ] Build completes in < 5 minutes
- [ ] No unnecessary dependencies
- [ ] Static assets cached properly

### 2. Runtime Performance
- [ ] Function cold start < 3 seconds
- [ ] API responses < 1 second
- [ ] Database queries optimized
- [ ] Proper indexes on tables

### 3. Monitoring
- [ ] Check Vercel Analytics
- [ ] Monitor function execution time
- [ ] Track error rates
- [ ] Monitor bandwidth usage

## Troubleshooting

### Build Fails
- [ ] Check build logs in Vercel
- [ ] Verify all dependencies installed
- [ ] Test build locally
- [ ] Check Node.js version

### Deployment Succeeds but App Doesn't Work
- [ ] Check function logs
- [ ] Verify environment variables
- [ ] Test database connection
- [ ] Check CORS configuration

### Database Connection Issues
- [ ] Verify DATABASE_URL format
- [ ] Check Neon database is running
- [ ] Ensure SSL mode is enabled
- [ ] Test connection from local machine

### Authentication Issues
- [ ] Verify AUTH_SECRET is set
- [ ] Check CORS_ORIGINS matches domain
- [ ] Clear browser cookies
- [ ] Verify auth_users table exists

## Rollback Plan

If deployment has issues:

### Option 1: Rollback via Dashboard
- [ ] Go to Vercel Dashboard
- [ ] Navigate to Deployments
- [ ] Find previous working deployment
- [ ] Click "Promote to Production"

### Option 2: Rollback via CLI
```bash
vercel ls
vercel rollback [previous-deployment-url]
```

### Option 3: Redeploy Previous Commit
- [ ] Revert git commit
- [ ] Push to GitHub
- [ ] Vercel auto-deploys

## Success Criteria

Deployment is successful when:

- ✅ Application loads without errors
- ✅ All API endpoints respond correctly
- ✅ Database operations work
- ✅ Authentication functions properly
- ✅ All user roles work as expected
- ✅ No console errors
- ✅ Build time < 5 minutes
- ✅ Function cold start < 3 seconds

## Next Steps After Successful Deployment

1. **Custom Domain**
   - [ ] Add domain in Vercel settings
   - [ ] Configure DNS
   - [ ] Verify SSL certificate

2. **Monitoring**
   - [ ] Set up error tracking (Sentry, etc.)
   - [ ] Configure uptime monitoring
   - [ ] Set up alerts

3. **Backups**
   - [ ] Verify Neon automatic backups
   - [ ] Document backup restoration process
   - [ ] Test backup restoration

4. **Documentation**
   - [ ] Update README with production URL
   - [ ] Document deployment process
   - [ ] Create runbook for common issues

5. **Team Access**
   - [ ] Add team members to Vercel project
   - [ ] Share environment variable access
   - [ ] Document deployment workflow

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard
**Neon Console**: https://console.neon.tech
**Deployment Logs**: `vercel logs your-app.vercel.app`
**Build Command**: `node vercel-build.js`
**Migration Command**: `npm run migrate`

---

**Need help?** See `VERCEL_DEPLOYMENT.md` for detailed instructions.