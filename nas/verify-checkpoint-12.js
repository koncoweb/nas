/**
 * Checkpoint 12: Simple Workflow Verification
 * 
 * This script performs basic checks to verify the system is ready
 * for manual workflow testing.
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function checkDatabaseConnection() {
  logSection('Step 1: Database Connection Check');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-db');
    const data = await response.json();
    
    if (response.ok && data.connected) {
      logSuccess('Database connection successful');
      logInfo(`Tables found: ${data.tables?.length || 0}`);
      logInfo(`Users in database: ${data.userCount || 0}`);
      return true;
    } else {
      logError('Database connection failed');
      logError(`Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError('Failed to connect to application');
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function checkAPIEndpoints() {
  logSection('Step 2: API Endpoints Check');
  
  const endpoints = [
    '/api/customers',
    '/api/materials',
    '/api/quotations',
    '/api/projects',
    '/api/material-requests',
    '/api/dashboard'
  ];
  
  let allAvailable = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      
      // We expect 401 (unauthorized) since we're not logged in
      // This means the endpoint exists and is protected
      if (response.status === 401) {
        logSuccess(`${endpoint} - Available (protected)`);
      } else if (response.status === 200) {
        logSuccess(`${endpoint} - Available (accessible)`);
      } else {
        logError(`${endpoint} - Unexpected status: ${response.status}`);
        allAvailable = false;
      }
    } catch (error) {
      logError(`${endpoint} - Not reachable`);
      allAvailable = false;
    }
  }
  
  return allAvailable;
}

async function checkPages() {
  logSection('Step 3: Page Routes Check');
  
  const pages = [
    '/login',
    '/dashboard',
    '/customers',
    '/materials',
    '/quotations',
    '/projects',
    '/material-requests'
  ];
  
  let allAvailable = true;
  
  for (const page of pages) {
    try {
      const response = await fetch(`http://localhost:3000${page}`);
      
      if (response.ok || response.status === 401 || response.status === 302) {
        logSuccess(`${page} - Available`);
      } else {
        logError(`${page} - Status: ${response.status}`);
        allAvailable = false;
      }
    } catch (error) {
      logError(`${page} - Not reachable`);
      allAvailable = false;
    }
  }
  
  return allAvailable;
}

function printManualTestingInstructions() {
  logSection('Manual Testing Instructions');
  
  log('\nTo complete Checkpoint 12, perform the following manual tests:\n', 'yellow');
  
  log('1. LOGIN', 'cyan');
  logInfo('   Navigate to http://localhost:3000/login');
  logInfo('   Log in with valid credentials');
  logInfo('   Verify successful authentication\n');
  
  log('2. CREATE QUOTATION', 'cyan');
  logInfo('   Go to /quotations and click "New Quotation"');
  logInfo('   Fill in customer, title, labor hours, and rate');
  logInfo('   Add line items with materials');
  logInfo('   Add scope of work steps');
  logInfo('   Verify cost calculations are correct');
  logInfo('   Change status: draft → sent → approved\n');
  
  log('3. CONVERT TO PROJECT', 'cyan');
  logInfo('   On the approved quotation page');
  logInfo('   Click "Convert to Project"');
  logInfo('   Verify project is created with unique project_number');
  logInfo('   Verify project links back to quotation');
  logInfo('   Update project status to "in_progress"\n');
  
  log('4. CREATE MATERIAL REQUEST', 'cyan');
  logInfo('   On the project page, click "New Material Request"');
  logInfo('   Fill in title, request type, and urgency');
  logInfo('   Add material items with quantities');
  logInfo('   Verify estimated total cost is calculated');
  logInfo('   Submit the request');
  logInfo('   Approve the request (as leader)\n');
  
  log('5. VERIFY WORKFLOW INTEGRITY', 'cyan');
  logInfo('   Check that project.quotation_id matches quotation.id');
  logInfo('   Check that material_request.project_id matches project.id');
  logInfo('   Check that all entities share the same customer');
  logInfo('   Verify all status transitions worked correctly');
  logInfo('   Verify all cost calculations are accurate\n');
  
  log('For detailed step-by-step instructions, see:', 'yellow');
  logInfo('   nas/CHECKPOINT_12_WORKFLOW_GUIDE.md\n');
}

async function runVerification() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     NAS REBUILD - CHECKPOINT 12 VERIFICATION               ║', 'cyan');
  log('║     Project Workflow Readiness Check                       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  let checks = 0;
  let passed = 0;
  
  // Check 1: Database
  checks++;
  if (await checkDatabaseConnection()) {
    passed++;
  }
  
  // Check 2: API Endpoints
  checks++;
  if (await checkAPIEndpoints()) {
    passed++;
  }
  
  // Check 3: Pages
  checks++;
  if (await checkPages()) {
    passed++;
  }
  
  // Summary
  logSection('Automated Checks Summary');
  
  log(`Total Checks: ${checks}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${checks - passed}`, 'red');
  
  if (passed === checks) {
    log('\n✓ All automated checks passed!', 'green');
    log('The system is ready for manual workflow testing.\n', 'green');
  } else {
    log(`\n✗ ${checks - passed} check(s) failed`, 'red');
    log('Please fix the issues above before proceeding.\n', 'red');
  }
  
  // Always show manual testing instructions
  printManualTestingInstructions();
  
  // Exit code
  process.exit(passed === checks ? 0 : 1);
}

// Run verification
runVerification().catch(error => {
  logError('Verification failed');
  console.error(error);
  process.exit(1);
});
