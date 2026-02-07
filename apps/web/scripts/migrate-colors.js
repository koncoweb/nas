#!/usr/bin/env node

/**
 * Script untuk migrasi warna dari palet lama ke palet baru
 * Mengganti warna gray/blue dengan neutral/primary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping warna lama ke baru
const colorMappings = {
  // Blue to Primary
  'bg-blue-50': 'bg-primary-50',
  'bg-blue-100': 'bg-primary-100',
  'bg-blue-200': 'bg-primary-200',
  'bg-blue-300': 'bg-primary-300',
  'bg-blue-400': 'bg-primary-400',
  'bg-blue-500': 'bg-primary-500',
  'bg-blue-600': 'bg-primary-600',
  'bg-blue-700': 'bg-primary-700',
  'bg-blue-800': 'bg-primary-800',
  'bg-blue-900': 'bg-primary-900',
  
  'text-blue-50': 'text-primary-50',
  'text-blue-100': 'text-primary-100',
  'text-blue-200': 'text-primary-200',
  'text-blue-300': 'text-primary-300',
  'text-blue-400': 'text-primary-400',
  'text-blue-500': 'text-primary-500',
  'text-blue-600': 'text-primary-600',
  'text-blue-700': 'text-primary-700',
  'text-blue-800': 'text-primary-800',
  'text-blue-900': 'text-primary-900',
  
  'border-blue-50': 'border-primary-50',
  'border-blue-100': 'border-primary-100',
  'border-blue-200': 'border-primary-200',
  'border-blue-300': 'border-primary-300',
  'border-blue-400': 'border-primary-400',
  'border-blue-500': 'border-primary-500',
  'border-blue-600': 'border-primary-600',
  'border-blue-700': 'border-primary-700',
  'border-blue-800': 'border-primary-800',
  'border-blue-900': 'border-primary-900',
  
  'hover:bg-blue-50': 'hover:bg-primary-50',
  'hover:bg-blue-100': 'hover:bg-primary-100',
  'hover:bg-blue-600': 'hover:bg-primary-600',
  'hover:bg-blue-700': 'hover:bg-primary-700',
  'hover:bg-blue-800': 'hover:bg-primary-800',
  
  'focus:ring-blue-500': 'focus:ring-primary-500',
  'focus:border-blue-500': 'focus:border-primary-500',
  
  // Gray to Neutral
  'bg-gray-50': 'bg-neutral-50',
  'bg-gray-100': 'bg-neutral-100',
  'bg-gray-200': 'bg-neutral-200',
  'bg-gray-300': 'bg-neutral-300',
  'bg-gray-400': 'bg-neutral-400',
  'bg-gray-500': 'bg-neutral-500',
  'bg-gray-600': 'bg-neutral-600',
  'bg-gray-700': 'bg-neutral-700',
  'bg-gray-800': 'bg-neutral-800',
  'bg-gray-900': 'bg-neutral-900',
  
  'text-gray-50': 'text-neutral-50',
  'text-gray-100': 'text-neutral-100',
  'text-gray-200': 'text-neutral-200',
  'text-gray-300': 'text-neutral-300',
  'text-gray-400': 'text-neutral-400',
  'text-gray-500': 'text-neutral-500',
  'text-gray-600': 'text-neutral-600',
  'text-gray-700': 'text-neutral-700',
  'text-gray-800': 'text-neutral-800',
  'text-gray-900': 'text-neutral-900',
  
  'border-gray-50': 'border-neutral-50',
  'border-gray-100': 'border-neutral-100',
  'border-gray-200': 'border-neutral-200',
  'border-gray-300': 'border-neutral-300',
  'border-gray-400': 'border-neutral-400',
  'border-gray-500': 'border-neutral-500',
  'border-gray-600': 'border-neutral-600',
  'border-gray-700': 'border-neutral-700',
  'border-gray-800': 'border-neutral-800',
  'border-gray-900': 'border-neutral-900',
  
  'hover:bg-gray-50': 'hover:bg-neutral-50',
  'hover:bg-gray-100': 'hover:bg-neutral-100',
  'hover:bg-gray-200': 'hover:bg-neutral-200',
  
  'ring-gray-300': 'ring-neutral-300',
  'divide-gray-200': 'divide-neutral-200',
};

function replaceColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
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
      // Skip node_modules and other build directories
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
console.log('🎨 Starting color migration...\n');

const srcDir = path.join(__dirname, '..', 'src');
const updatedFiles = walkDirectory(srcDir);

console.log(`\n✨ Migration complete! Updated ${updatedFiles} files.`);
console.log('\n📝 Note: Please review the changes and test your application.');
console.log('💡 Tip: Run "git diff" to see all changes before committing.');
