#!/usr/bin/env node
/**
 * Simple build script that uses local Vite installation
 */

import { build } from 'vite';

console.log('🏗️  Building with Vite...');

try {
  await build({
    configFile: './vite.config.ts',
    mode: 'production'
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
