const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/reports/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the dynamic UPDATE query with a simpler version using sql.unsafe for the SET clause
const pattern = /const \[updatedReport\] = await sql\([\s\S]*?values\s*\);/;

const replacement = `const setClause = updates.map((update, i) => {
      const value = values[i];
      if (typeof value === 'string') {
        return update.replace(/\\$\\d+/, \`'\${value}'\`);
      } else if (value instanceof Date) {
        return update.replace(/\\$\\d+/, \`'\${value.toISOString()}'\`);
      } else {
        return update.replace(/\\$\\d+/, \`\${value}\`);
      }
    }).join(', ');
    
    const result = await sql.unsafe(\`
      UPDATE project_reports 
      SET \${setClause}
      WHERE id = \${reportId}
      RETURNING *
    \`);
    
    const updatedReport = result[0];`;

content = content.replace(pattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed UPDATE query in reports route');
