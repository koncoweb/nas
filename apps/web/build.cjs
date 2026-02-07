#!/usr/bin/env node
/**
 * Build script using CommonJS (guaranteed to work)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🏗️  Starting build process...');
console.log('📁 Working directory:', __dirname);

try {
  // Use npx with the locally installed vite
  // The key is to set NODE_PATH so vite can find @react-router/dev
  const env = {
    ...process.env,
    NODE_PATH: path.join(__dirname, 'node_modules')
  };
  
  console.log('📦 Running vite build...');
  
  // Run vite build with explicit node_modules path
  execSync('npx --package=vite@6.4.1 -- vite build --config vite.config.ts', {
    stdio: 'inherit',
    cwd: __dirname,
    env: env
  });
  
  console.log('✅ Build completed successfully!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
