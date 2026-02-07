#!/usr/bin/env node

/**
 * Script untuk mengganti warna hardcoded yang tidak tertangkap oleh migrasi otomatis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping warna hardcoded ke warna baru
const hardcodedMappings = {
  // Green to Accent/Primary
  'bg-green-50': 'bg-accent-50',
  'bg-green-100': 'bg-accent-100',
  'text-green-600': 'text-accent-600',
  'text-green-700': 'text-accent-700',
  'text-green-800': 'text-accent-800',
  'border-green-200': 'border-accent-200',
  'border-green-300': 'border-accent-300',
  
  // Orange to Accent
  'bg-orange-50': 'bg-accent-50',
  'bg-orange-100': 'bg-accent-100',
  'text-orange-600': 'text-accent-600',
  'text-orange-700': 'text-accent-700',
  'border-orange-200': 'border-accent-200',
  
  // Purple to Primary
  'bg-purple-50': 'bg-primary-50',
  'bg-purple-100': 'bg-primary-100',
  'text-purple-600': 'text-primary-600',
  'text-purple-700': 'text-primary-700',
  'border-purple-200': 'border-primary-200',
  
  // Red to keep for errors (but lighter)
  'bg-red-500': 'bg-red-600',
  
  // Yellow to Accent
  'bg-yellow-50': 'bg-accent-50',
  'bg-yellow-100': 'bg-accent-100',
  'text-yellow-600': 'text-accent-600',
  'text-yellow-700': 'text-accent-700',
  'border-yellow-200': 'border-accent-200',
  
  // Indigo to Primary
  'from-indigo-50': 'from-accent-50',
  'to-indigo-50': 'to-accent-50',
  'bg-indigo-50': 'bg-primary-50',
  'bg-indigo-100': 'bg-primary-100',
  'text-indigo-600': 'text-primary-600',
  'text-indigo-700': 'text-primary-700',
};

function replaceColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(hardcodedMappings).forEach(([oldColor, newColor]) => {
      const regex = new RegExp(oldColor, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newColor);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, fileExtensions = ['.jsx', '.js', '.tsx', '.ts']) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        updatedCount += walkDirectory(filePath, fileExtensions);
      }
    } else if (fileExtensions.some(ext => file.endsWith(ext))) {
      if (replaceColorsInFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🎨 Fixing hardcoded colors...\n');

const srcDir = path.join(__dirname, '..', 'src');
const updatedFiles = walkDirectory(srcDir);

console.log(`\n✨ Fixed ${updatedFiles} files with hardcoded colors.`);
console.log('\n📝 Note: Please restart your dev server to see the changes.');
