const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace sql.unsafe with regular sql template and use sql.unsafe only for the SET clause
content = content.replace(
  /const result = await sql\.unsafe\(`[\s\S]*?`\)/,
  `const result = await sql\`
      UPDATE projects
      SET \${sql.unsafe(setClause)}
      WHERE id = \${projectId}
      RETURNING 
        id,
        project_number,
        quotation_id,
        customer_id,
        title,
        description,
        status,
        assigned_engineer,
        start_date,
        expected_completion,
        actual_completion,
        created_at,
        updated_at
    \``
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed to use regular sql template with unsafe for SET clause');
