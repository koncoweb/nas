#!/usr/bin/env node
/**
 * Simple build script that uses local Vite installation
 */

console.log('🏗️  Building with Vite...');

try {
  // Import vite directly - let Node.js resolve it
  const { build } = await import('vite');
  
  console.log('✅ Vite loaded successfully');
  
  await build({
    configFile: './vite.config.ts',
    mode: 'production',
    logLevel: 'info'
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
