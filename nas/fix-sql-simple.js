const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire section with a simple working version
const pattern = /\/\/ Build update query dynamically using sql template[\s\S]*?const project = result\[0\]/;

const replacement = `// Build update object
    const updates: any = {}
    
    if (validated.title !== undefined) updates.title = validated.title
    if (validated.description !== undefined) updates.description = validated.description
    if (body.status !== undefined) {
      updates.status = body.status
      if (body.status === "completed") {
        updates.actual_completion = new Date()
      }
    }
    if (validated.assigned_engineer !== undefined) updates.assigned_engineer = validated.assigned_engineer
    if (validated.start_date !== undefined) updates.start_date = validated.start_date
    if (validated.expected_completion !== undefined) updates.expected_completion = validated.expected_completion
    updates.updated_at = new Date()

    if (Object.keys(updates).length === 1) { // Only updated_at
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Build SET clause dynamically
    const setClause = Object.keys(updates)
      .map((key, index) => \`\${key} = $\${index + 1}\`)
      .join(', ')
    
    const values = Object.values(updates)
    values.push(projectId) // Add for WHERE clause
    
    const result = await sql.unsafe(
      \`UPDATE projects 
       SET \${setClause}
       WHERE id = $\${values.length}
       RETURNING id, project_number, quotation_id, customer_id, title, description, 
                 status, assigned_engineer, start_date, expected_completion, 
                 actual_completion, created_at, updated_at\`,
      values
    )
    
    const project = result[0]`;

content = content.replace(pattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL query with simple approach');
