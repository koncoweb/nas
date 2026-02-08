/**
 * Script to fix all remaining params issues in API routes for Next.js 16
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/material-requests/[id]/items/route.ts',
  'src/app/api/reports/[id]/route.ts',
  'src/app/api/reports/[id]/approve/route.ts',
  'src/app/api/projects/[id]/route.ts',
  'src/app/api/quotations/[id]/convert-to-project/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Fix: const id = parseInt(id) -> const { id } = await params; const requestId = parseInt(id)
  const badPattern = /(\s+)(const \w+ = parseInt\(id\))/g;
  
  // First, check if we need to add await params
  if (content.includes('const') && content.includes('= parseInt(id)')) {
    // Find all function declarations with params
    const funcPattern = /export async function (GET|POST|PUT|DELETE)\([^)]+\{ params \}[^)]+\) \{[^}]*?const session[^\n]+\n([^\n]*\n){0,10}?(\s+)(const \w+ = parseInt\(id\))/g;
    
    content = content.replace(funcPattern, (match, method, middle, indent, parseStatement) => {
      // Check if await params is already there
      if (match.includes('await params')) {
        return match;
      }
      
      // Add await params before the parseInt
      const varName = parseStatement.match(/const (\w+) =/)[1];
      const replacement = match.replace(
        parseStatement,
        `${indent}const { id } = await params\n${indent}const ${varName} = parseInt(id)`
      );
      
      // Replace all occurrences of ${id} with ${varName} in SQL queries
      return replacement.replace(/\$\{id\}/g, `\${${varName}}`);
    });
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

console.log('🔧 Fixing remaining API route params for Next.js 16...\n');

filesToFix.forEach(fixFile);

console.log('\n✨ Done!');
