#!/usr/bin/env node

/**
 * Complete Foundation Test
 * 
 * This script performs a comprehensive test of the foundation once
 * environment variables are configured. It tests:
 * 1. Environment variables are set
 * 2. Build succeeds
 * 3. Database connection works (requires dev server running)
 * 4. All required files exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 NAS Foundation Complete Test\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === 'warning') {
      console.log(`⚠️  ${name}`);
      warnings++;
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    failed++;
  }
}

console.log('\n📋 Test Suite: Environment Variables\n');

test('DATABASE_URL is configured', () => {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const dbUrl = envContent.match(/DATABASE_URL="([^"]*)"/)?.[1];
  if (!dbUrl || dbUrl === '') {
    throw new Error('DATABASE_URL is not set');
  }
  if (!dbUrl.includes('postgresql://')) {
    throw new Error('DATABASE_URL does not appear to be a valid PostgreSQL connection string');
  }
});

test('AUTH_SECRET is configured', () => {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const authSecret = envContent.match(/AUTH_SECRET="([^"]*)"/)?.[1];
  if (!authSecret || authSecret === '') {
    throw new Error('AUTH_SECRET is not set');
  }
  if (authSecret.length < 32) {
    throw new Error('AUTH_SECRET should be at least 32 characters');
  }
});

test('NEXTAUTH_URL is configured', () => {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const nextAuthUrl = envContent.match(/NEXTAUTH_URL="([^"]*)"/)?.[1];
  if (!nextAuthUrl) {
    throw new Error('NEXTAUTH_URL is not set');
  }
});

console.log('\n📦 Test Suite: Dependencies\n');

test('All required dependencies installed', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
  );
  
  const required = [
    '@neondatabase/serverless',
    'next-auth',
    'argon2',
    'zod',
    '@tabler/icons-react',
    'next',
    'react'
  ];
  
  for (const dep of required) {
    if (!packageJson.dependencies[dep]) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
});

test('node_modules directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    throw new Error('node_modules not found - run npm install');
  }
});

console.log('\n📁 Test Suite: File Structure\n');

const requiredFiles = [
  'src/lib/db.ts',
  'src/lib/auth.ts',
  'src/lib/validations.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/test-db/route.ts',
  'src/app/(auth)/login/page.tsx',
  'src/app/(dashboard)/layout.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Header.tsx',
  'src/components/shared/DataTable.tsx',
  'src/middleware.ts',
  'vercel.json'
];

requiredFiles.forEach(file => {
  test(`File exists: ${file}`, () => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`File not found: ${file}`);
    }
  });
});

console.log('\n🏗️  Test Suite: Build System\n');

test('TypeScript configuration is valid', () => {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  if (!tsconfig.compilerOptions) {
    throw new Error('tsconfig.json missing compilerOptions');
  }
});

test('Next.js build succeeds', () => {
  console.log('   Building... (this may take a moment)');
  try {
    execSync('npm run build', {
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
  } catch (error) {
    throw new Error('Build failed: ' + error.message);
  }
});

test('.next directory created', () => {
  if (!fs.existsSync(path.join(__dirname, '.next'))) {
    throw new Error('.next directory not found after build');
  }
});

console.log('\n🚀 Test Suite: Deployment Configuration\n');

test('vercel.json is properly configured', () => {
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf-8')
  );
  
  if (vercelConfig.buildCommand !== 'next build') {
    throw new Error('buildCommand should be "next build"');
  }
  
  if (vercelConfig.framework !== 'nextjs') {
    throw new Error('framework should be "nextjs"');
  }
});

console.log('\n⚠️  Test Suite: Runtime Tests (requires dev server)\n');

console.log('⚠️  Database connection test skipped (requires dev server)');
console.log('   To test: npm run dev, then visit http://localhost:3000/api/test-db');
warnings++;

console.log('⚠️  Authentication test skipped (requires dev server)');
console.log('   To test: npm run dev, then visit http://localhost:3000/login');
warnings++;

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results:\n');
console.log(`✅ Passed:   ${passed}`);
console.log(`❌ Failed:   ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (failed > 0) {
  console.log('\n❌ Foundation test FAILED');
  console.log('\nPlease fix the errors above before proceeding.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Foundation test PASSED with warnings');
  console.log('\nCore foundation is solid. Runtime tests require dev server.');
  console.log('\nNext steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Test database: http://localhost:3000/api/test-db');
  console.log('3. Test login: http://localhost:3000/login');
  console.log('4. Deploy to Vercel');
  process.exit(0);
} else {
  console.log('\n✅ Foundation test PASSED');
  console.log('\nAll tests completed successfully!');
  process.exit(0);
}
