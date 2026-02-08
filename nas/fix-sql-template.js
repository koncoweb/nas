const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire problematic section
const pattern = /\/\/ Build update query dynamically using sql template[\s\S]*?const project = result\[0\]/;

const replacement = `// Build update fields
    const updateFields = []
    
    if (validated.title !== undefined) {
      updateFields.push({ key: 'title', value: validated.title })
    }
    if (validated.description !== undefined) {
      updateFields.push({ key: 'description', value: validated.description })
    }
    if (body.status !== undefined) {
      updateFields.push({ key: 'status', value: body.status })
      if (body.status === "completed") {
        updateFields.push({ key: 'actual_completion', value: new Date() })
      }
    }
    if (validated.assigned_engineer !== undefined) {
      updateFields.push({ key: 'assigned_engineer', value: validated.assigned_engineer })
    }
    if (validated.start_date !== undefined) {
      updateFields.push({ key: 'start_date', value: validated.start_date })
    }
    if (validated.expected_completion !== undefined) {
      updateFields.push({ key: 'expected_completion', value: validated.expected_completion })
    }
    
    updateFields.push({ key: 'updated_at', value: new Date() })

    if (updateFields.length === 1) { // Only updated_at
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Build the SET clause using template literals
    const setClause = updateFields
      .map(f => \`\${f.key} = '\${f.value}'\`)
      .join(', ')
    
    const result = await sql.unsafe(\`
      UPDATE projects
      SET \${setClause}
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
    \`)
    
    const project = result[0]`;

content = content.replace(pattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL query with template approach');
