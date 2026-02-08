# Deployment Guide for NAS

This guide will help you deploy the NAS Marine Engineering Project Management System to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. Your Neon PostgreSQL database connection string
4. An authentication secret key

## Step 1: Prepare Your Repository

1. Initialize a git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: NAS project setup"
```

2. Push to your remote repository:
```bash
git remote add origin <your-repository-url>
git push -u origin main
```

## Step 2: Generate Authentication Secret

Generate a secure random string for AUTH_SECRET:

```bash
openssl rand -base64 32
```

Save this value - you'll need it in the next step.

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure your project:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (or `nas` if deploying from monorepo)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following variables:
     ```
     DATABASE_URL=<your-neon-connection-string>
     AUTH_SECRET=<generated-secret-from-step-2>
     NEXTAUTH_URL=https://your-project.vercel.app
     ```
   - Note: NEXTAUTH_URL will be your actual Vercel URL after first deployment

6. Click "Deploy"

7. After deployment, update NEXTAUTH_URL:
   - Go to Project Settings → Environment Variables
   - Update NEXTAUTH_URL with your actual Vercel URL
   - Redeploy the project

### Option B: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and add environment variables when asked

5. For production deployment:
```bash
vercel --prod
```

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., https://your-project.vercel.app)
2. You should see the NAS welcome page
3. Check the Vercel deployment logs for any errors

## Step 5: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Update NEXTAUTH_URL environment variable with your custom domain
6. Redeploy

## Troubleshooting

### Build Fails

- Check that all dependencies are in package.json
- Verify Node.js version compatibility (18+)
- Check build logs in Vercel dashboard

### Database Connection Issues

- Verify DATABASE_URL is correct
- Ensure Neon database allows connections from Vercel IPs
- Check that SSL mode is enabled in connection string

### Authentication Issues

- Verify AUTH_SECRET is set correctly
- Ensure NEXTAUTH_URL matches your deployment URL
- Check that it includes https:// protocol

### Environment Variables Not Working

- Ensure variables are set in Vercel dashboard
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to your main/master branch
- **Preview**: When you create a pull request

To disable auto-deployment:
1. Go to Project Settings → Git
2. Configure deployment branches

## Monitoring

Monitor your deployment:
- **Logs**: Vercel Dashboard → Your Project → Deployments → View Logs
- **Analytics**: Vercel Dashboard → Your Project → Analytics
- **Performance**: Vercel Dashboard → Your Project → Speed Insights

## Rollback

To rollback to a previous deployment:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the working deployment
3. Click "..." → "Promote to Production"

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Neon Documentation: https://neon.tech/docs
