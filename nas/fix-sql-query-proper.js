const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the problematic section and replace it with a working version
const oldSection = /\/\/ Add project ID as last parameter[\s\S]*?const project = result\[0\]/;

const newSection = `// Build the update query using template literals
    const result = await sql\`
      UPDATE projects
      SET \${sql.unsafe(updates.map((update, i) => {
        const placeholder = update.replace(/\\$\\d+/, '\${values[' + i + ']}');
        return placeholder;
      }).join(", "))}
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
    \`
    
    const project = result[0]`;

content = content.replace(oldSection, newSection);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL query properly in projects route');
