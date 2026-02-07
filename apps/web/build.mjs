#!/usr/bin/env node
/**
 * Simple build script that uses local Vite installation
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

console.log('🏗️  Building with Vite...');
console.log('📁 Working directory:', __dirname);

try {
  // Import vite from node_modules
  const vitePath = join(__dirname, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  console.log('📦 Loading Vite from:', vitePath);
  
  const { build } = await import(vitePath);
  
  await build({
    configFile: join(__dirname, 'vite.config.ts'),
    mode: 'production',
    logLevel: 'info'
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
