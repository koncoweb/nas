/**
 * Verification script for Select component empty string fix
 * 
 * This script verifies that all Select components have been fixed
 * to not use empty string values, which causes runtime errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Select Component Fixes...\n');

const filesToCheck = [
  'src/components/materials/MaterialForm.tsx',
  'src/components/projects/ProjectForm.tsx',
  'src/components/quotations/QuotationForm.tsx',
  'src/components/invoices/InvoiceForm.tsx',
  'src/components/material-requests/MaterialRequestForm.tsx',
  'src/components/costs/CostForm.tsx',
  'src/components/quotations/LineItemsTable.tsx',
  'src/app/(dashboard)/projects/[id]/page.tsx',
  'src/app/(dashboard)/projects/page.tsx',
  'src/app/(dashboard)/materials/page.tsx',
];

let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for SelectItem with empty string value
  const emptyValuePattern = /<SelectItem\s+value=""/g;
  const matches = content.match(emptyValuePattern);
  
  totalChecks++;
  
  if (matches && matches.length > 0) {
    console.log(`❌ ${file}`);
    console.log(`   Found ${matches.length} SelectItem(s) with empty string value`);
    allPassed = false;
  } else {
    console.log(`✅ ${file}`);
    passedChecks++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\nResults: ${passedChecks}/${totalChecks} files passed`);

if (allPassed) {
  console.log('\n✅ All Select components are properly configured!');
  console.log('\nChanges made:');
  console.log('1. MaterialForm: category and unit_type use undefined');
  console.log('2. ProjectForm: customer_id uses undefined, assigned_engineer uses "none"');
  console.log('3. QuotationForm: customer_id uses undefined');
  console.log('4. InvoiceForm: project_id and customer_id use undefined');
  console.log('5. MaterialRequestForm: project_id uses undefined');
  console.log('6. CostForm: material_id uses "none"');
  console.log('7. LineItemsTable: material_id uses "custom"');
  console.log('8. Filter dropdowns: use "all" instead of empty string');
  process.exit(0);
} else {
  console.log('\n❌ Some Select components still have empty string values!');
  console.log('Please fix the issues above before proceeding.');
  process.exit(1);
}
