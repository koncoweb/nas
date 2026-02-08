const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/projects/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire problematic section with a working version
const pattern = /\/\/ Build update query dynamically[\s\S]*?const project = result\[0\]/;

const replacement = `// Build update query dynamically using sql template
    const setClauses = []
    
    if (validated.title !== undefined) {
      setClauses.push(sql\`title = \${validated.title}\`)
    }
    if (validated.description !== undefined) {
      setClauses.push(sql\`description = \${validated.description}\`)
    }
    if (body.status !== undefined) {
      setClauses.push(sql\`status = \${body.status}\`)
      
      // Set actual_completion if status is completed
      if (body.status === "completed") {
        setClauses.push(sql\`actual_completion = \${new Date()}\`)
      }
    }
    if (validated.assigned_engineer !== undefined) {
      setClauses.push(sql\`assigned_engineer = \${validated.assigned_engineer}\`)
    }
    if (validated.start_date !== undefined) {
      setClauses.push(sql\`start_date = \${validated.start_date}\`)
    }
    if (validated.expected_completion !== undefined) {
      setClauses.push(sql\`expected_completion = \${validated.expected_completion}\`)
    }

    // Always update updated_at
    setClauses.push(sql\`updated_at = \${new Date()}\`)

    if (setClauses.length === 1) { // Only updated_at
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Execute update
    const result = await sql\`
      UPDATE projects
      SET \${sql.join(setClauses, sql\`, \`)}
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

content = content.replace(pattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed SQL query with proper template literals');
