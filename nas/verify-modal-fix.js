/**
 * Verification Script: Modal Window and Dropdown Transparency Fix
 * 
 * This script verifies that all modal and dropdown components have been fixed
 * and are using the correct Radix UI imports with solid backgrounds.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Modal Window and Dropdown Transparency Fix...\n');

const componentsToCheck = [
  { file: 'src/components/ui/dialog.tsx', name: 'Dialog', import: '@radix-ui/react-dialog', bg: 'bg-white dark:bg-gray-900' },
  { file: 'src/components/ui/select.tsx', name: 'Select', import: '@radix-ui/react-select', bg: 'bg-white dark:bg-gray-900' },
  { file: 'src/components/ui/dropdown-menu.tsx', name: 'DropdownMenu', import: '@radix-ui/react-dropdown-menu', bg: 'bg-white dark:bg-gray-900' },
  { file: 'src/components/ui/label.tsx', name: 'Label', import: '@radix-ui/react-label', bg: null },
  { file: 'src/components/ui/separator.tsx', name: 'Separator', import: '@radix-ui/react-separator', bg: null },
  { file: 'src/components/ui/scroll-area.tsx', name: 'ScrollArea', import: '@radix-ui/react-scroll-area', bg: null },
  { file: 'src/components/ui/button.tsx', name: 'Button', import: '@radix-ui/react-slot', bg: null },
  { file: 'src/components/ui/avatar.tsx', name: 'Avatar', import: '@radix-ui/react-avatar', bg: null },
];

let allPassed = true;

componentsToCheck.forEach(component => {
  console.log(`✓ Checking ${component.name} component`);
  const componentPath = path.join(__dirname, component.file);
  
  if (!fs.existsSync(componentPath)) {
    console.log(`  ❌ File not found: ${component.file}\n`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(componentPath, 'utf8');

  // Check import
  if (content.includes(`from "${component.import}"`)) {
    console.log(`  ✅ Correct import: ${component.import}`);
  } else {
    console.log(`  ❌ FAILED: Incorrect import statement`);
    allPassed = false;
  }

  // Check background if applicable
  if (component.bg) {
    if (content.includes(component.bg)) {
      console.log(`  ✅ Solid background found`);
    } else {
      console.log(`  ❌ FAILED: Missing solid background`);
      allPassed = false;
    }
  }

  console.log('');
});

// Check 4: List all components using Dialog
console.log('✓ Listing components using Dialog/Select');
const componentsWithDialog = [
  'src/components/materials/MaterialModal.tsx',
  'src/components/customers/CustomerModal.tsx',
  'src/components/quotations/LineItemsTable.tsx',
  'src/components/quotations/ScopeOfWorkForm.tsx',
  'src/components/material-requests/RequestItemsTable.tsx',
  'src/components/invoices/InvoiceLineItemsTable.tsx',
  'src/components/invoices/PaymentForm.tsx',
  'src/app/(dashboard)/projects/[id]/page.tsx',
];

componentsWithDialog.forEach(component => {
  const componentPath = path.join(__dirname, component);
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    if (content.includes('DialogContent') || content.includes('SelectContent')) {
      console.log(`  ✅ ${component}`);
    } else {
      console.log(`  ⚠️  ${component} (no DialogContent/SelectContent found)`);
    }
  } else {
    console.log(`  ❌ ${component} (file not found)`);
    allPassed = false;
  }
});

if (!allPassed) {
  console.log('\n❌ Some checks failed\n');
  process.exit(1);
}

console.log('\n✅ All checks passed!');
console.log('\n📋 Summary:');
console.log('  • Dialog component: FIXED');
console.log('  • Select component: FIXED');
console.log('  • DropdownMenu component: FIXED');
console.log('  • Label component: FIXED');
console.log('  • Separator component: FIXED');
console.log('  • ScrollArea component: FIXED');
console.log('  • Button component: FIXED');
console.log('  • Avatar component: FIXED');
console.log('  • All modal components: VERIFIED');
console.log('  • All dropdown components: VERIFIED');
console.log('\n🎉 Modal and dropdown transparency issues have been successfully fixed!\n');
