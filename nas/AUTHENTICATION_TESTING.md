# Authentication Testing Guide

## Prerequisites

Before testing authentication, you need to configure the database connection:

1. Copy the `.env.local.example` to `.env.local` (if not already done)
2. Add your Neon database connection string to `.env.local`:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Getting the Database Connection String

You can get the connection string from:
- Neon Console: https://console.neon.tech/app/projects/misty-wave-96189879
- Or use the Neon CLI: `neonctl connection-string`

### Generating AUTH_SECRET

Generate a secure random string for AUTH_SECRET:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Test Users

The database contains 4 test users with different roles:

| Email | Role | User ID |
|-------|------|---------|
| admin@nas2.com | leader | 1 |
| sales@nas2.com | sales | 2 |
| engineer@nas2.com | engineer | 3 |
| accounting@nas2.com | accounting | 4 |

**Note:** You'll need to know the passwords for these users. If you don't have them, you can:
1. Ask the database administrator
2. Or create a new user with a known password (see "Creating Test Users" section below)

## Testing Steps

### 1. Start the Development Server

```bash
cd nas
npm run dev
```

The application will be available at http://localhost:3000

### 2. Test Database Connection

Visit http://localhost:3000/api/test-db

You should see a JSON response with:
```json
{
  "connected": true,
  "message": "Database connection successful",
  "tables": [...],
  "userCount": 4
}
```

If you see an error, check your DATABASE_URL in `.env.local`

### 3. Test Login Flow

1. Visit http://localhost:3000
2. You should be redirected to http://localhost:3000/login
3. Enter one of the test user emails and password
4. Click "Sign in"
5. If successful, you'll be redirected to http://localhost:3000/dashboard
6. You should see your name, email, and role displayed

### 4. Test Protected Routes

Try accessing http://localhost:3000/dashboard directly:
- If not logged in: redirected to /login
- If logged in: see dashboard with user info

### 5. Test Logout

On the dashboard page:
1. Click the "Sign out" button in the navigation
2. You should be redirected to /login
3. Try accessing /dashboard again - you should be redirected to /login

## Creating Test Users

If you need to create a new test user with a known password, you can use this SQL:

```sql
-- 1. Create the user
INSERT INTO auth_users (name, email, user_role)
VALUES ('Test User', 'test@example.com', 'sales')
RETURNING id;

-- 2. Create the account with password (replace [USER_ID] with the ID from step 1)
-- Note: You'll need to hash the password using Argon2id first
-- For testing, you can use an online Argon2 hash generator or Node.js script

INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", password)
VALUES (
  [USER_ID],
  'credentials',
  'credentials',
  'test@example.com',
  '[ARGON2_HASHED_PASSWORD]'
);
```

### Hashing Passwords with Argon2

Create a Node.js script to hash passwords:

```javascript
// hash-password.js
const argon2 = require('argon2');

async function hashPassword(password) {
  const hash = await argon2.hash(password);
  console.log('Hashed password:', hash);
}

hashPassword(process.argv[2] || 'password123');
```

Run it:
```bash
node hash-password.js "your-password-here"
```

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution:** Make sure `.env.local` exists and contains a valid DATABASE_URL

### Error: "Invalid email or password"

**Possible causes:**
1. Wrong email or password
2. User doesn't exist in database
3. Password hash in database doesn't match

**Solution:** 
- Verify the email exists: `SELECT * FROM auth_users WHERE email = 'your-email@example.com'`
- Check if account exists: `SELECT * FROM auth_accounts WHERE "userId" = [USER_ID]`
- Verify password is hashed with Argon2id

### Error: "Authentication error" in console

**Possible causes:**
1. Database connection issue
2. SQL query error
3. Argon2 verification error

**Solution:** Check the server console for detailed error messages

### Redirected to login immediately after signing in

**Possible causes:**
1. Session not being created properly
2. AUTH_SECRET not set or invalid
3. Cookie not being set

**Solution:**
- Check browser console for errors
- Verify AUTH_SECRET is set in `.env.local`
- Check server logs for session creation errors

### "Cannot find module 'argon2'"

**Solution:** Install dependencies:
```bash
npm install
```

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use strong passwords** for production users
3. **Rotate AUTH_SECRET** regularly in production
4. **Use HTTPS** in production (NEXTAUTH_URL should start with https://)
5. **Set secure cookie options** in production NextAuth config

## Next Steps

After successful authentication testing:
1. Implement role-based access control
2. Add password reset functionality
3. Implement email verification
4. Add two-factor authentication (optional)
5. Set up session management and timeout
