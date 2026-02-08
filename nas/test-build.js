#!/usr/bin/env node

/**
 * Build Test Script
 * 
 * Verifies that the Next.js build completes successfully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Testing Next.js Build...\n');

try {
  // Run the build
  console.log('Running: npm run build\n');
  const output = execSync('npm run build', {
    cwd: __dirname,
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  console.log(output);

  // Check if .next directory was created
  const nextDir = path.join(__dirname, '.next');
  if (!fs.existsSync(nextDir)) {
    throw new Error('.next directory was not created');
  }

  console.log('\n✅ Build completed successfully!');
  console.log('✅ .next directory created');
  
  // Check for build artifacts
  const buildManifest = path.join(nextDir, 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    console.log('✅ Build manifest generated');
  }

  console.log('\n🎉 Build test PASSED');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Build test FAILED');
  console.error('\nError:', error.message);
  
  if (error.stdout) {
    console.error('\nBuild output:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('\nBuild errors:', error.stderr.toString());
  }
  
  process.exit(1);
}
