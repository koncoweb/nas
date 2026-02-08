const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace sql.join with manual string building
content = content.replace(
  /SET \$\{sql\.join\(setClauses, sql`, `\)\}/,
  'SET ${sql.unsafe(setClauses.map((_, i) => `$${i + 1}`).join(", "))}'
);

// We also need to pass the values properly
// Replace the entire query section
const pattern = /\/\/ Execute update[\s\S]*?const project = result\[0\]/;

const replacement = `// Execute update - build values array from setClauses
    const setValues = []
    let setString = ''
    
    if (validated.title !== undefined) {
      setString += (setString ? ', ' : '') + \`title = $\${setValues.length + 1}\`
      setValues.push(validated.title)
    }
    if (validated.description !== undefined) {
      setString += (setString ? ', ' : '') + \`description = $\${setValues.length + 1}\`
      setValues.push(validated.description)
    }
    if (body.status !== undefined) {
      setString += (setString ? ', ' : '') + \`status = $\${setValues.length + 1}\`
      setValues.push(body.status)
      
      if (body.status === "completed") {
        setString += (setString ? ', ' : '') + \`actual_completion = $\${setValues.length + 1}\`
        setValues.push(new Date())
      }
    }
    if (validated.assigned_engineer !== undefined) {
      setString += (setString ? ', ' : '') + \`assigned_engineer = $\${setValues.length + 1}\`
      setValues.push(validated.assigned_engineer)
    }
    if (validated.start_date !== undefined) {
      setString += (setString ? ', ' : '') + \`start_date = $\${setValues.length + 1}\`
      setValues.push(validated.start_date)
    }
    if (validated.expected_completion !== undefined) {
      setString += (setString ? ', ' : '') + \`expected_completion = $\${setValues.length + 1}\`
      setValues.push(validated.expected_completion)
    }
    
    // Always update updated_at
    setString += (setString ? ', ' : '') + \`updated_at = $\${setValues.length + 1}\`
    setValues.push(new Date())
    
    // Add projectId for WHERE clause
    setValues.push(projectId)
    
    const result = await sql.unsafe(\`
      UPDATE projects
      SET \${setString}
      WHERE id = $\${setValues.length}
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
    \`, setValues)
    
    const project = result[0]`;

content = content.replace(pattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL query with manual value building');
