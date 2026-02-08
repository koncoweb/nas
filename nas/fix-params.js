/**
 * Script to fix params in API routes for Next.js 16
 * In Next.js 16, params are now async and must be awaited
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/reports/[id]/approve/route.ts',
  'src/app/api/projects/[id]/route.ts',
  'src/app/api/quotations/[id]/convert-to-project/route.ts',
  'src/app/api/material-requests/[id]/route.ts',
  'src/app/api/material-requests/[id]/items/route.ts',
  'src/app/api/material-requests/[id]/approve/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/invoices/[id]/payment/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Replace params type
  const oldPattern = /\{ params \}: \{ params: \{ id: string \} \}/g;
  const newPattern = '{ params }: { params: Promise<{ id: string }> }';
  
  if (content.match(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    modified = true;
  }
  
  // Replace params.id usage
  const paramsIdPattern = /const (\w+) = parseInt\(params\.id\)/g;
  const matches = [...content.matchAll(paramsIdPattern)];
  
  if (matches.length > 0) {
    // Add await params before first usage
    content = content.replace(
      /(\s+const session[^\n]+\n[^\n]*\n[^\n]*\n[^\n]*\n)(\s+const \w+ = parseInt\(params\.id\))/,
      '$1\n    const { id } = await params\n$2'
    );
    
    // Replace params.id with id
    content = content.replace(/parseInt\(params\.id\)/g, 'parseInt(id)');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

console.log('🔧 Fixing API route params for Next.js 16...\n');

filesToFix.forEach(fixFile);

console.log('\n✨ Done!');
