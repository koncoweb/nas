const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace validated.status with body.status
content = content.replace(/validated\.status/g, 'body.status');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed status validation in projects route');
