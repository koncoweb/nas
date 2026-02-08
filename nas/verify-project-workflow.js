/**
 * Checkpoint 12: Project Workflow Verification
 * 
 * This script verifies the complete quotation → project → material request workflow
 * by testing the end-to-end integration of these three core features.
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// Colors for console output
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

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// API helper function
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Test data
let testData = {
  customer: null,
  material: null,
  quotation: null,
  project: null,
  materialRequest: null
};

// Verification steps
async function verifyDatabaseConnection() {
  logSection('Step 1: Verify Database Connection');
  
  const result = await apiCall('/api/test-db');
  
  if (result.ok) {
    logSuccess('Database connection successful');
    logInfo(`Database: ${result.data.database || 'Connected'}`);
    return true;
  } else {
    logError('Database connection failed');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function createTestCustomer() {
  logSection('Step 2: Create Test Customer');
  
  const customerData = {
    company_name: `Test Company ${Date.now()}`,
    contact_name: 'John Doe',
    email: `test${Date.now()}@example.com`,
    phone: '555-0100',
    address: '123 Test Street'
  };
  
  const result = await apiCall('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  });
  
  if (result.ok) {
    testData.customer = result.data;
    logSuccess('Test customer created');
    logInfo(`Customer ID: ${testData.customer.id}`);
    logInfo(`Company: ${testData.customer.company_name}`);
    return true;
  } else {
    logError('Failed to create test customer');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function createTestMaterial() {
  logSection('Step 3: Create Test Material');
  
  const materialData = {
    name: `Test Material ${Date.now()}`,
    description: 'Test material for workflow verification',
    category: 'Hardware',
    unit_type: 'piece',
    unit_cost: 25.50,
    supplier: 'Test Supplier',
    part_number: `TM-${Date.now()}`
  };
  
  const result = await apiCall('/api/materials', {
    method: 'POST',
    body: JSON.stringify(materialData)
  });
  
  if (result.ok) {
    testData.material = result.data;
    logSuccess('Test material created');
    logInfo(`Material ID: ${testData.material.id}`);
    logInfo(`Name: ${testData.material.name}`);
    return true;
  } else {
    logError('Failed to create test material');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function createTestQuotation() {
  logSection('Step 4: Create Test Quotation');
  
  const quotationData = {
    customer_id: testData.customer.id,
    title: 'Test Quotation for Workflow',
    description: 'Testing quotation → project → material request flow',
    labor_hours: 40,
    labor_rate: 75,
    profit_margin: 0.15
  };
  
  const result = await apiCall('/api/quotations', {
    method: 'POST',
    body: JSON.stringify(quotationData)
  });
  
  if (result.ok) {
    testData.quotation = result.data;
    logSuccess('Test quotation created');
    logInfo(`Quotation ID: ${testData.quotation.id}`);
    logInfo(`Quote Number: ${testData.quotation.quote_number}`);
    logInfo(`Status: ${testData.quotation.status}`);
    return true;
  } else {
    logError('Failed to create test quotation');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function addQuotationLineItems() {
  logSection('Step 5: Add Line Items to Quotation');
  
  const lineItem = {
    material_id: testData.material.id,
    description: testData.material.name,
    quantity: 10,
    unit_price: testData.material.unit_cost
  };
  
  const result = await apiCall(`/api/quotations/${testData.quotation.id}/line-items`, {
    method: 'POST',
    body: JSON.stringify(lineItem)
  });
  
  if (result.ok) {
    logSuccess('Line item added to quotation');
    logInfo(`Line Total: $${result.data.line_total}`);
    
    // Fetch updated quotation to see recalculated costs
    const quotationResult = await apiCall(`/api/quotations/${testData.quotation.id}`);
    if (quotationResult.ok) {
      testData.quotation = quotationResult.data;
      logInfo(`Materials Cost: $${testData.quotation.materials_cost}`);
      logInfo(`Labor Cost: $${testData.quotation.labor_cost}`);
      logInfo(`Total Cost: $${testData.quotation.total_cost}`);
    }
    return true;
  } else {
    logError('Failed to add line item');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function addScopeOfWork() {
  logSection('Step 6: Add Scope of Work to Quotation');
  
  const scopeItems = [
    {
      step_number: 1,
      description: 'Initial assessment and planning',
      work_category: 'Planning'
    },
    {
      step_number: 2,
      description: 'Material procurement and preparation',
      work_category: 'Preparation'
    },
    {
      step_number: 3,
      description: 'Installation and testing',
      work_category: 'Installation'
    }
  ];
  
  let allSuccess = true;
  
  for (const item of scopeItems) {
    const result = await apiCall(`/api/quotations/${testData.quotation.id}/scope-work`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    
    if (result.ok) {
      logSuccess(`Step ${item.step_number}: ${item.description}`);
    } else {
      logError(`Failed to add step ${item.step_number}`);
      allSuccess = false;
    }
  }
  
  return allSuccess;
}

async function approveQuotation() {
  logSection('Step 7: Approve Quotation');
  
  // First update status to 'sent'
  let result = await apiCall(`/api/quotations/${testData.quotation.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'sent' })
  });
  
  if (!result.ok) {
    logError('Failed to update quotation to sent status');
    return false;
  }
  
  logSuccess('Quotation marked as sent');
  
  // Then approve it
  result = await apiCall(`/api/quotations/${testData.quotation.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'approved' })
  });
  
  if (result.ok) {
    testData.quotation = result.data;
    logSuccess('Quotation approved');
    logInfo(`Status: ${testData.quotation.status}`);
    return true;
  } else {
    logError('Failed to approve quotation');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function convertToProject() {
  logSection('Step 8: Convert Quotation to Project');
  
  const result = await apiCall(`/api/quotations/${testData.quotation.id}/convert-to-project`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  if (result.ok) {
    testData.project = result.data;
    logSuccess('Quotation converted to project');
    logInfo(`Project ID: ${testData.project.id}`);
    logInfo(`Project Number: ${testData.project.project_number}`);
    logInfo(`Status: ${testData.project.status}`);
    logInfo(`Title: ${testData.project.title}`);
    return true;
  } else {
    logError('Failed to convert quotation to project');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function updateProjectStatus() {
  logSection('Step 9: Update Project Status to In Progress');
  
  const result = await apiCall(`/api/projects/${testData.project.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'in_progress',
      start_date: new Date().toISOString()
    })
  });
  
  if (result.ok) {
    testData.project = result.data;
    logSuccess('Project status updated');
    logInfo(`Status: ${testData.project.status}`);
    logInfo(`Start Date: ${testData.project.start_date}`);
    return true;
  } else {
    logError('Failed to update project status');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function createMaterialRequest() {
  logSection('Step 10: Create Material Request for Project');
  
  const materialRequestData = {
    project_id: testData.project.id,
    request_type: 'purchase',
    title: 'Materials for Test Project',
    urgency: 'medium'
  };
  
  const result = await apiCall('/api/material-requests', {
    method: 'POST',
    body: JSON.stringify(materialRequestData)
  });
  
  if (result.ok) {
    testData.materialRequest = result.data;
    logSuccess('Material request created');
    logInfo(`Request ID: ${testData.materialRequest.id}`);
    logInfo(`Status: ${testData.materialRequest.status}`);
    return true;
  } else {
    logError('Failed to create material request');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function addMaterialRequestItems() {
  logSection('Step 11: Add Items to Material Request');
  
  const items = [
    {
      material_id: testData.material.id,
      description: testData.material.name,
      quantity: 15,
      estimated_unit_cost: testData.material.unit_cost
    },
    {
      material_id: null,
      description: 'Additional custom material',
      quantity: 5,
      estimated_unit_cost: 50.00
    }
  ];
  
  let allSuccess = true;
  
  for (const item of items) {
    const result = await apiCall(`/api/material-requests/${testData.materialRequest.id}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    
    if (result.ok) {
      logSuccess(`Added: ${item.description} (Qty: ${item.quantity})`);
    } else {
      logError(`Failed to add: ${item.description}`);
      allSuccess = false;
    }
  }
  
  // Fetch updated material request to see calculated total
  const requestResult = await apiCall(`/api/material-requests/${testData.materialRequest.id}`);
  if (requestResult.ok) {
    testData.materialRequest = requestResult.data;
    logInfo(`Estimated Total Cost: $${testData.materialRequest.estimated_total_cost}`);
  }
  
  return allSuccess;
}

async function submitMaterialRequest() {
  logSection('Step 12: Submit Material Request');
  
  const result = await apiCall(`/api/material-requests/${testData.materialRequest.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'submitted' })
  });
  
  if (result.ok) {
    testData.materialRequest = result.data;
    logSuccess('Material request submitted');
    logInfo(`Status: ${testData.materialRequest.status}`);
    return true;
  } else {
    logError('Failed to submit material request');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function approveMaterialRequest() {
  logSection('Step 13: Approve Material Request');
  
  const result = await apiCall(`/api/material-requests/${testData.materialRequest.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  if (result.ok) {
    testData.materialRequest = result.data;
    logSuccess('Material request approved');
    logInfo(`Status: ${testData.materialRequest.status}`);
    return true;
  } else {
    logError('Failed to approve material request');
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
}

async function verifyWorkflowIntegrity() {
  logSection('Step 14: Verify Workflow Integrity');
  
  let allChecks = true;
  
  // Check 1: Verify project is linked to quotation
  if (testData.project.quotation_id === testData.quotation.id) {
    logSuccess('Project correctly linked to quotation');
  } else {
    logError('Project not properly linked to quotation');
    allChecks = false;
  }
  
  // Check 2: Verify project has same customer as quotation
  if (testData.project.customer_id === testData.quotation.customer_id) {
    logSuccess('Project has correct customer reference');
  } else {
    logError('Project customer mismatch');
    allChecks = false;
  }
  
  // Check 3: Verify material request is linked to project
  if (testData.materialRequest.project_id === testData.project.id) {
    logSuccess('Material request correctly linked to project');
  } else {
    logError('Material request not properly linked to project');
    allChecks = false;
  }
  
  // Check 4: Verify status progression
  if (testData.quotation.status === 'approved') {
    logSuccess('Quotation in approved status');
  } else {
    logError('Quotation status incorrect');
    allChecks = false;
  }
  
  if (testData.project.status === 'in_progress') {
    logSuccess('Project in in_progress status');
  } else {
    logError('Project status incorrect');
    allChecks = false;
  }
  
  if (testData.materialRequest.status === 'approved') {
    logSuccess('Material request in approved status');
  } else {
    logError('Material request status incorrect');
    allChecks = false;
  }
  
  // Check 5: Verify cost calculations
  if (testData.quotation.total_cost > 0) {
    logSuccess(`Quotation total calculated: $${testData.quotation.total_cost}`);
  } else {
    logError('Quotation total not calculated');
    allChecks = false;
  }
  
  if (testData.materialRequest.estimated_total_cost > 0) {
    logSuccess(`Material request total calculated: $${testData.materialRequest.estimated_total_cost}`);
  } else {
    logError('Material request total not calculated');
    allChecks = false;
  }
  
  return allChecks;
}

async function cleanupTestData() {
  logSection('Step 15: Cleanup Test Data');
  
  logInfo('Leaving test data in database for manual inspection');
  logInfo('Test data IDs:');
  logInfo(`  Customer ID: ${testData.customer?.id}`);
  logInfo(`  Material ID: ${testData.material?.id}`);
  logInfo(`  Quotation ID: ${testData.quotation?.id}`);
  logInfo(`  Project ID: ${testData.project?.id}`);
  logInfo(`  Material Request ID: ${testData.materialRequest?.id}`);
  
  return true;
}

// Main execution
async function runVerification() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     NAS REBUILD - PROJECT WORKFLOW VERIFICATION            ║', 'cyan');
  log('║     Checkpoint 12: Quotation → Project → Material Request  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const steps = [
    { name: 'Database Connection', fn: verifyDatabaseConnection },
    { name: 'Create Test Customer', fn: createTestCustomer },
    { name: 'Create Test Material', fn: createTestMaterial },
    { name: 'Create Test Quotation', fn: createTestQuotation },
    { name: 'Add Quotation Line Items', fn: addQuotationLineItems },
    { name: 'Add Scope of Work', fn: addScopeOfWork },
    { name: 'Approve Quotation', fn: approveQuotation },
    { name: 'Convert to Project', fn: convertToProject },
    { name: 'Update Project Status', fn: updateProjectStatus },
    { name: 'Create Material Request', fn: createMaterialRequest },
    { name: 'Add Material Request Items', fn: addMaterialRequestItems },
    { name: 'Submit Material Request', fn: submitMaterialRequest },
    { name: 'Approve Material Request', fn: approveMaterialRequest },
    { name: 'Verify Workflow Integrity', fn: verifyWorkflowIntegrity },
    { name: 'Cleanup', fn: cleanupTestData }
  ];
  
  let passedSteps = 0;
  let failedSteps = 0;
  
  for (const step of steps) {
    try {
      const success = await step.fn();
      if (success) {
        passedSteps++;
      } else {
        failedSteps++;
        logWarning(`Step failed: ${step.name}`);
        // Continue with remaining steps to see full picture
      }
    } catch (error) {
      failedSteps++;
      logError(`Step error: ${step.name}`);
      logError(`Exception: ${error.message}`);
    }
  }
  
  // Final summary
  logSection('Verification Summary');
  
  log(`Total Steps: ${steps.length}`, 'blue');
  log(`Passed: ${passedSteps}`, 'green');
  log(`Failed: ${failedSteps}`, 'red');
  
  if (failedSteps === 0) {
    log('\n✓ ALL CHECKS PASSED - Project workflow is functioning correctly!', 'green');
    process.exit(0);
  } else {
    log(`\n✗ ${failedSteps} CHECK(S) FAILED - Please review the errors above`, 'red');
    process.exit(1);
  }
}

// Run the verification
runVerification().catch(error => {
  logError('Verification script failed');
  logError(error.message);
  console.error(error);
  process.exit(1);
});
