const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the destructuring assignment with regular assignment
content = content.replace(
  /const \[project\] = await sql\.unsafe\(/,
  'const result = await sql.unsafe('
);

// Add the array access after the query
content = content.replace(
  /(const result = await sql\.unsafe\(`[\s\S]*?`, values\))/,
  '$1\n    \n    const project = result[0]'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL destructuring in projects route');
