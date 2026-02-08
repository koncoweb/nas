const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/reports/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all sql( with sql` (template literal)
// This is a simple regex that should catch most cases
content = content.replace(/await sql\(\s*`/g, 'await sql`');

// Remove the closing ), from the end of queries
content = content.replace(/`,\s*\[[^\]]*\]\s*\);/g, '`');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL calls in reports route');
