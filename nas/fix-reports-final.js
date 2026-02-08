const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/reports/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace sql.unsafe with regular sql template
content = content.replace(
  /const result = await sql\.unsafe\(`[\s\S]*?`\);[\s\S]*?const updatedReport = result\[0\];/,
  `const result = await sql\`
      UPDATE project_reports 
      SET \${sql.unsafe(setClause)}
      WHERE id = \${reportId}
      RETURNING *
    \`;
    
    const updatedReport = result[0];`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed to use regular sql template in reports route');
