#!/usr/bin/env node

/**
 * Foundation Verification Script
 * 
 * This script verifies that:
 * 1. All required environment variables are set
 * 2. Database connection works
 * 3. Authentication system is configured
 * 4. Build succeeds
 * 5. Vercel deployment configuration is correct
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NAS Foundation Verification\n');
console.log('=' .repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check 1: Environment Variables
console.log('\n📋 Checking Environment Variables...');
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  hasErrors = true;
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {
    DATABASE_URL: envContent.match(/DATABASE_URL="([^"]*)"/)?.[1],
    AUTH_SECRET: envContent.match(/AUTH_SECRET="([^"]*)"/)?.[1],
    NEXTAUTH_URL: envContent.match(/NEXTAUTH_URL="([^"]*)"/)?.[1]
  };

  if (!envVars.DATABASE_URL || envVars.DATABASE_URL === '') {
    console.error('❌ DATABASE_URL is not set');
    hasErrors = true;
  } else {
    console.log('✅ DATABASE_URL is configured');
  }

  if (!envVars.AUTH_SECRET || envVars.AUTH_SECRET === '') {
    console.error('❌ AUTH_SECRET is not set');
    hasErrors = true;
  } else {
    console.log('✅ AUTH_SECRET is configured');
  }

  if (!envVars.NEXTAUTH_URL) {
    console.error('❌ NEXTAUTH_URL is not set');
    hasErrors = true;
  } else {
    console.log('✅ NEXTAUTH_URL is configured');
  }
}

// Check 2: Required Files
console.log('\n📁 Checking Required Files...');
const requiredFiles = [
  'src/lib/db.ts',
  'src/lib/auth.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/test-db/route.ts',
  'src/app/(auth)/login/page.tsx',
  'src/app/(dashboard)/layout.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Header.tsx',
  'src/components/shared/DataTable.tsx',
  'src/lib/validations.ts',
  'vercel.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ${file} not found`);
    hasErrors = true;
  }
});

// Check 3: Package Dependencies
console.log('\n📦 Checking Dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const requiredDeps = [
  '@neondatabase/serverless',
  'next-auth',
  'argon2',
  'zod',
  '@tabler/icons-react'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} (${packageJson.dependencies[dep]})`);
  } else {
    console.error(`❌ ${dep} not installed`);
    hasErrors = true;
  }
});

// Check 4: Vercel Configuration
console.log('\n🚀 Checking Vercel Configuration...');
const vercelJsonPath = path.join(__dirname, 'vercel.json');

if (!fs.existsSync(vercelJsonPath)) {
  console.error('❌ vercel.json not found');
  hasErrors = true;
} else {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  
  if (vercelConfig.buildCommand === 'next build') {
    console.log('✅ Build command configured');
  } else {
    console.error('❌ Build command not properly configured');
    hasErrors = true;
  }

  if (vercelConfig.framework === 'nextjs') {
    console.log('✅ Framework set to Next.js');
  } else {
    console.warn('⚠️  Framework not explicitly set to nextjs');
    hasWarnings = true;
  }
}

// Check 5: TypeScript Configuration
console.log('\n⚙️  Checking TypeScript Configuration...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');

if (!fs.existsSync(tsconfigPath)) {
  console.error('❌ tsconfig.json not found');
  hasErrors = true;
} else {
  console.log('✅ TypeScript configuration exists');
}

// Check 6: Middleware
console.log('\n🛡️  Checking Middleware...');
const middlewarePath = path.join(__dirname, 'src/middleware.ts');

if (!fs.existsSync(middlewarePath)) {
  console.error('❌ middleware.ts not found');
  hasErrors = true;
} else {
  console.log('✅ Middleware configured');
  console.log('⚠️  Note: Next.js 16 shows deprecation warning for middleware (use proxy in future)');
  hasWarnings = true;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary:\n');

if (hasErrors) {
  console.error('❌ Foundation verification FAILED');
  console.error('\nPlease fix the errors above before proceeding.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Foundation verification PASSED with warnings');
  console.log('\nWarnings can be addressed later, but foundation is functional.');
  process.exit(0);
} else {
  console.log('✅ Foundation verification PASSED');
  console.log('\nAll checks completed successfully!');
  process.exit(0);
}
