# Environment Variables Documentation

This document describes all environment variables required for the NAS Marine Engineering Project Management System.

## Required Variables

### DATABASE_URL

**Description**: PostgreSQL database connection string for Neon database

**Format**: 
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Example**:
```
DATABASE_URL=postgresql://nas_user:password123@ep-misty-wave-96189879.us-east-1.aws.neon.tech/nas?sslmode=require
```

**Where to get it**:
1. Log in to your Neon console at https://console.neon.tech
2. Select your project (NAS, id: misty-wave-96189879)
3. Go to "Connection Details"
4. Copy the connection string
5. Ensure `?sslmode=require` is appended

**Important Notes**:
- Must include `?sslmode=require` for secure connection
- Keep this value secret - never commit to version control
- Use the pooled connection string for better performance

---

### AUTH_SECRET

**Description**: Secret key used for encrypting session tokens and cookies

**Format**: Random base64-encoded string (minimum 32 characters)

**How to generate**:

**Option 1: Using OpenSSL (Linux/Mac)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Using PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Example**:
```
AUTH_SECRET=Xk7mP9qR2sT5vW8yZ1aC4dF6gH9jK0lN3oQ5rU7wX9zA2bC4eF6h
```

**Important Notes**:
- Must be at least 32 characters long
- Keep this value secret - never commit to version control
- Generate a new secret for each environment (development, staging, production)
- Changing this value will invalidate all existing sessions

---

### NEXTAUTH_URL

**Description**: The canonical URL of your deployment

**Format**: Full URL including protocol (https://)

**Examples**:

**Production**:
```
NEXTAUTH_URL=https://nas-project.vercel.app
```

**Custom Domain**:
```
NEXTAUTH_URL=https://nas.yourcompany.com
```

**Development**:
```
NEXTAUTH_URL=http://localhost:3000
```

**Important Notes**:
- Must match your actual deployment URL
- Must include protocol (https:// for production, http:// for local development)
- Do not include trailing slash
- Update this after first deployment if using Vercel auto-generated URL
- Required for OAuth callbacks and session management

---

## Optional Variables

### NODE_ENV

**Description**: Specifies the environment mode

**Values**: `development`, `production`, `test`

**Default**: Automatically set by Next.js and Vercel

**Example**:
```
NODE_ENV=production
```

**Important Notes**:
- Vercel automatically sets this to `production` for production deployments
- Affects logging, error handling, and optimization
- Usually not needed to set manually

---

### NEXTAUTH_DEBUG

**Description**: Enables debug logging for NextAuth.js

**Values**: `true` or `false`

**Default**: `false`

**Example**:
```
NEXTAUTH_DEBUG=true
```

**When to use**:
- Troubleshooting authentication issues
- Development and testing
- **Never enable in production** (exposes sensitive information)

---

## Setting Environment Variables

### Local Development (.env.local)

1. Create a `.env.local` file in the `nas` directory
2. Add your environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication
AUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

3. Never commit `.env.local` to version control (already in .gitignore)

### Vercel Deployment

**Option 1: Vercel Dashboard**

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, and/or Development
4. Click "Save"
5. Redeploy your application for changes to take effect

**Option 2: Vercel CLI**

```bash
# Set a single variable
vercel env add DATABASE_URL production

# Import from .env file
vercel env pull .env.local
```

**Important Notes**:
- Environment variables are encrypted at rest
- Changes require redeployment to take effect
- Different values can be set for Production, Preview, and Development
- Preview deployments (pull requests) can use different values than production

### Environment-Specific Configuration

**Production**:
```env
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host/nas?sslmode=require
AUTH_SECRET=production-secret-key-here
NEXTAUTH_URL=https://nas-project.vercel.app
NODE_ENV=production
```

**Preview/Staging**:
```env
DATABASE_URL=postgresql://staging_user:staging_pass@staging-host/nas?sslmode=require
AUTH_SECRET=staging-secret-key-here
NEXTAUTH_URL=https://nas-project-preview.vercel.app
NODE_ENV=production
```

**Development**:
```env
DATABASE_URL=postgresql://dev_user:dev_pass@dev-host/nas?sslmode=require
AUTH_SECRET=development-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
NEXTAUTH_DEBUG=true
```

---

## Security Best Practices

### 1. Never Commit Secrets

- Add `.env.local` to `.gitignore` (already done)
- Never commit environment variables to version control
- Use Vercel's environment variable management

### 2. Use Different Secrets Per Environment

- Generate unique `AUTH_SECRET` for each environment
- Use separate databases for development, staging, and production
- Never use production credentials in development

### 3. Rotate Secrets Regularly

- Change `AUTH_SECRET` periodically (will invalidate sessions)
- Update database passwords on a schedule
- Keep a secure backup of current values before rotating

### 4. Limit Access

- Only share environment variables with team members who need them
- Use Vercel's team permissions to control access
- Store secrets in a password manager

### 5. Monitor Usage

- Review Vercel deployment logs for authentication errors
- Monitor database connection logs
- Set up alerts for suspicious activity

---

## Troubleshooting

### "Database connection failed"

**Possible causes**:
- `DATABASE_URL` is incorrect or missing
- Database is not accessible from Vercel
- SSL mode is not enabled

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Ensure `?sslmode=require` is appended
3. Check Neon database is running
4. Verify Vercel can access Neon (check firewall rules)

### "Invalid session" or "Authentication failed"

**Possible causes**:
- `AUTH_SECRET` is incorrect or missing
- `AUTH_SECRET` was changed (invalidates existing sessions)
- `NEXTAUTH_URL` doesn't match deployment URL

**Solutions**:
1. Verify `AUTH_SECRET` is set correctly
2. Verify `NEXTAUTH_URL` matches your deployment URL
3. Clear browser cookies and try again
4. Check NextAuth.js logs (enable `NEXTAUTH_DEBUG=true`)

### "Callback URL mismatch"

**Possible causes**:
- `NEXTAUTH_URL` doesn't match actual deployment URL
- Protocol mismatch (http vs https)

**Solutions**:
1. Update `NEXTAUTH_URL` to match deployment URL
2. Ensure protocol is correct (https:// for production)
3. Redeploy after updating

### Environment variables not updating

**Possible causes**:
- Deployment not triggered after changing variables
- Variables set for wrong environment

**Solutions**:
1. Trigger a new deployment after changing variables
2. Verify variables are set for correct environment (Production/Preview/Development)
3. Check Vercel deployment logs for variable values (be careful with secrets)

---

## Verification Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` is set and correct
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] `AUTH_SECRET` is generated and set (minimum 32 characters)
- [ ] `NEXTAUTH_URL` matches deployment URL
- [ ] `NEXTAUTH_URL` uses https:// (for production)
- [ ] All variables are set in Vercel Dashboard
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets are committed to version control
- [ ] Different secrets are used for each environment

---

## Quick Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host/db?sslmode=require` | Neon connection string |
| `AUTH_SECRET` | ✅ Yes | `Xk7mP9qR2sT5vW8yZ1aC4dF6gH9jK0lN` | Min 32 chars, base64 |
| `NEXTAUTH_URL` | ✅ Yes | `https://nas-project.vercel.app` | Full URL with protocol |
| `NODE_ENV` | ❌ No | `production` | Auto-set by Vercel |
| `NEXTAUTH_DEBUG` | ❌ No | `true` | Dev only, never in prod |

---

**Last Updated**: February 8, 2026  
**Document Version**: 1.0.0
