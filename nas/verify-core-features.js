/**
 * Core Features Verification Script
 * 
 * This script verifies:
 * 1. Customer CRUD operations
 * 2. Materials CRUD operations
 * 3. Dashboard functionality
 * 4. Database connectivity
 * 5. Authentication system
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

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
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const status = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${status} ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test Results Tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  results.tests.push({ name, passed, details });
  logTest(name, passed, details);
}

// Verification Tests
async function verifyDatabaseConnection() {
  logSection('1. Database Connection Test');
  
  try {
    const response = await makeRequest('/api/test-db');
    const passed = response.status === 200 && response.data.success;
    recordTest(
      'Database connectivity',
      passed,
      passed ? 'Successfully connected to Neon PostgreSQL' : `Failed: ${JSON.stringify(response.data)}`
    );
    return passed;
  } catch (error) {
    recordTest('Database connectivity', false, `Error: ${error.message}`);
    return false;
  }
}

async function verifyCustomerCRUD() {
  logSection('2. Customer CRUD Operations');
  
  let createdCustomerId = null;
  
  // Test: Create Customer
  try {
    const testCustomer = {
      company_name: `Test Company ${Date.now()}`,
      contact_name: 'John Doe',
      email: `test${Date.now()}@example.com`,
      phone: '555-0123',
      address: '123 Test Street'
    };
    
    const createResponse = await makeRequest('/api/customers', {
      method: 'POST',
      body: testCustomer
    });
    
    const createPassed = createResponse.status === 201 && createResponse.data.id;
    createdCustomerId = createResponse.data.id;
    recordTest(
      'Create customer',
      createPassed,
      createPassed ? `Created customer ID: ${createdCustomerId}` : `Failed: ${JSON.stringify(createResponse.data)}`
    );
  } catch (error) {
    recordTest('Create customer', false, `Error: ${error.message}`);
  }
  
  // Test: Read Customers (List)
  try {
    const listResponse = await makeRequest('/api/customers?page=1&limit=10');
    const listPassed = listResponse.status === 200 && Array.isArray(listResponse.data.data);
    recordTest(
      'List customers',
      listPassed,
      listPassed ? `Retrieved ${listResponse.data.data.length} customers` : `Failed: ${JSON.stringify(listResponse.data)}`
    );
  } catch (error) {
    recordTest('List customers', false, `Error: ${error.message}`);
  }
  
  // Test: Read Single Customer
  if (createdCustomerId) {
    try {
      const getResponse = await makeRequest(`/api/customers/${createdCustomerId}`);
      const getPassed = getResponse.status === 200 && getResponse.data.id === createdCustomerId;
      recordTest(
        'Get single customer',
        getPassed,
        getPassed ? `Retrieved customer: ${getResponse.data.company_name}` : `Failed: ${JSON.stringify(getResponse.data)}`
      );
    } catch (error) {
      recordTest('Get single customer', false, `Error: ${error.message}`);
    }
    
    // Test: Update Customer
    try {
      const updateData = {
        company_name: `Updated Company ${Date.now()}`,
        contact_name: 'Jane Doe',
        email: `updated${Date.now()}@example.com`,
        phone: '555-9999',
        address: '456 Updated Street'
      };
      
      const updateResponse = await makeRequest(`/api/customers/${createdCustomerId}`, {
        method: 'PUT',
        body: updateData
      });
      
      const updatePassed = updateResponse.status === 200 && updateResponse.data.company_name === updateData.company_name;
      recordTest(
        'Update customer',
        updatePassed,
        updatePassed ? 'Customer updated successfully' : `Failed: ${JSON.stringify(updateResponse.data)}`
      );
    } catch (error) {
      recordTest('Update customer', false, `Error: ${error.message}`);
    }
    
    // Test: Delete Customer
    try {
      const deleteResponse = await makeRequest(`/api/customers/${createdCustomerId}`, {
        method: 'DELETE'
      });
      
      const deletePassed = deleteResponse.status === 200;
      recordTest(
        'Delete customer',
        deletePassed,
        deletePassed ? 'Customer deleted successfully' : `Failed: ${JSON.stringify(deleteResponse.data)}`
      );
    } catch (error) {
      recordTest('Delete customer', false, `Error: ${error.message}`);
    }
  }
  
  // Test: Search Customers
  try {
    const searchResponse = await makeRequest('/api/customers?search=test&page=1&limit=10');
    const searchPassed = searchResponse.status === 200 && Array.isArray(searchResponse.data.data);
    recordTest(
      'Search customers',
      searchPassed,
      searchPassed ? `Search returned ${searchResponse.data.data.length} results` : `Failed: ${JSON.stringify(searchResponse.data)}`
    );
  } catch (error) {
    recordTest('Search customers', false, `Error: ${error.message}`);
  }
}

async function verifyMaterialsCRUD() {
  logSection('3. Materials CRUD Operations');
  
  let createdMaterialId = null;
  
  // Test: Create Material
  try {
    const testMaterial = {
      name: `Test Material ${Date.now()}`,
      description: 'Test material description',
      category: 'Hardware',
      unit_type: 'piece',
      unit_cost: 25.50,
      supplier: 'Test Supplier',
      part_number: `PN-${Date.now()}`
    };
    
    const createResponse = await makeRequest('/api/materials', {
      method: 'POST',
      body: testMaterial
    });
    
    const createPassed = createResponse.status === 201 && createResponse.data.id;
    createdMaterialId = createResponse.data.id;
    recordTest(
      'Create material',
      createPassed,
      createPassed ? `Created material ID: ${createdMaterialId}` : `Failed: ${JSON.stringify(createResponse.data)}`
    );
  } catch (error) {
    recordTest('Create material', false, `Error: ${error.message}`);
  }
  
  // Test: Read Materials (List)
  try {
    const listResponse = await makeRequest('/api/materials?page=1&limit=10');
    const listPassed = listResponse.status === 200 && Array.isArray(listResponse.data.data);
    recordTest(
      'List materials',
      listPassed,
      listPassed ? `Retrieved ${listResponse.data.data.length} materials` : `Failed: ${JSON.stringify(listResponse.data)}`
    );
  } catch (error) {
    recordTest('List materials', false, `Error: ${error.message}`);
  }
  
  // Test: Read Single Material
  if (createdMaterialId) {
    try {
      const getResponse = await makeRequest(`/api/materials/${createdMaterialId}`);
      const getPassed = getResponse.status === 200 && getResponse.data.id === createdMaterialId;
      recordTest(
        'Get single material',
        getPassed,
        getPassed ? `Retrieved material: ${getResponse.data.name}` : `Failed: ${JSON.stringify(getResponse.data)}`
      );
    } catch (error) {
      recordTest('Get single material', false, `Error: ${error.message}`);
    }
    
    // Test: Update Material
    try {
      const updateData = {
        name: `Updated Material ${Date.now()}`,
        description: 'Updated description',
        category: 'Electrical',
        unit_type: 'meter',
        unit_cost: 35.75,
        supplier: 'Updated Supplier',
        part_number: `UPN-${Date.now()}`
      };
      
      const updateResponse = await makeRequest(`/api/materials/${createdMaterialId}`, {
        method: 'PUT',
        body: updateData
      });
      
      const updatePassed = updateResponse.status === 200 && updateResponse.data.name === updateData.name;
      recordTest(
        'Update material',
        updatePassed,
        updatePassed ? 'Material updated successfully' : `Failed: ${JSON.stringify(updateResponse.data)}`
      );
    } catch (error) {
      recordTest('Update material', false, `Error: ${error.message}`);
    }
    
    // Test: Delete Material
    try {
      const deleteResponse = await makeRequest(`/api/materials/${createdMaterialId}`, {
        method: 'DELETE'
      });
      
      const deletePassed = deleteResponse.status === 200;
      recordTest(
        'Delete material',
        deletePassed,
        deletePassed ? 'Material deleted successfully' : `Failed: ${JSON.stringify(deleteResponse.data)}`
      );
    } catch (error) {
      recordTest('Delete material', false, `Error: ${error.message}`);
    }
  }
  
  // Test: Search Materials
  try {
    const searchResponse = await makeRequest('/api/materials?search=test&page=1&limit=10');
    const searchPassed = searchResponse.status === 200 && Array.isArray(searchResponse.data.data);
    recordTest(
      'Search materials',
      searchPassed,
      searchPassed ? `Search returned ${searchResponse.data.data.length} results` : `Failed: ${JSON.stringify(searchResponse.data)}`
    );
  } catch (error) {
    recordTest('Search materials', false, `Error: ${error.message}`);
  }
  
  // Test: Filter by Category
  try {
    const filterResponse = await makeRequest('/api/materials?category=Hardware&page=1&limit=10');
    const filterPassed = filterResponse.status === 200 && Array.isArray(filterResponse.data.data);
    recordTest(
      'Filter materials by category',
      filterPassed,
      filterPassed ? `Filter returned ${filterResponse.data.data.length} results` : `Failed: ${JSON.stringify(filterResponse.data)}`
    );
  } catch (error) {
    recordTest('Filter materials by category', false, `Error: ${error.message}`);
  }
}

async function verifyDashboard() {
  logSection('4. Dashboard Functionality');
  
  try {
    const response = await makeRequest('/api/dashboard');
    const passed = response.status === 200 && response.data.statistics;
    
    if (passed) {
      const stats = response.data.statistics;
      recordTest(
        'Dashboard statistics',
        true,
        `Active Projects: ${stats.activeProjects}, Pending Quotations: ${stats.pendingQuotations}, Pending Material Requests: ${stats.pendingMaterialRequests}`
      );
      
      const hasActivities = Array.isArray(response.data.recentActivities);
      recordTest(
        'Dashboard recent activities',
        hasActivities,
        hasActivities ? `Retrieved ${response.data.recentActivities.length} recent activities` : 'No activities found'
      );
    } else {
      recordTest('Dashboard statistics', false, `Failed: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    recordTest('Dashboard functionality', false, `Error: ${error.message}`);
  }
}

async function verifyAuthentication() {
  logSection('5. Authentication System');
  
  // Test: Login page accessibility
  try {
    const response = await makeRequest('/login');
    const passed = response.status === 200;
    recordTest(
      'Login page accessible',
      passed,
      passed ? 'Login page is accessible' : `Failed with status: ${response.status}`
    );
  } catch (error) {
    recordTest('Login page accessible', false, `Error: ${error.message}`);
  }
  
  // Test: Protected routes require authentication
  try {
    const response = await makeRequest('/dashboard');
    // Should redirect to login or return 401/403
    const passed = response.status === 401 || response.status === 403 || response.status === 307 || response.status === 302;
    recordTest(
      'Protected routes require auth',
      passed,
      passed ? 'Dashboard correctly requires authentication' : `Unexpected status: ${response.status}`
    );
  } catch (error) {
    recordTest('Protected routes require auth', false, `Error: ${error.message}`);
  }
}

// Main execution
async function runVerification() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║         NAS Core Features Verification Script             ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTarget: ${BASE_URL}`, 'yellow');
  log('Starting verification tests...\n', 'yellow');
  
  try {
    await verifyDatabaseConnection();
    await verifyCustomerCRUD();
    await verifyMaterialsCRUD();
    await verifyDashboard();
    await verifyAuthentication();
    
    // Print Summary
    logSection('Verification Summary');
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, 'red');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'yellow');
    
    if (results.failed === 0) {
      log('\n✓ All core features verified successfully!', 'green');
      log('The application is ready for the next phase of development.\n', 'green');
      process.exit(0);
    } else {
      log('\n✗ Some tests failed. Please review the results above.', 'red');
      log('Failed tests:', 'red');
      results.tests.filter(t => !t.passed).forEach(t => {
        log(`  - ${t.name}: ${t.details}`, 'red');
      });
      console.log();
      process.exit(1);
    }
  } catch (error) {
    log(`\n✗ Verification failed with error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Check if server is running
log('Checking if development server is running...', 'yellow');
makeRequest('/api/test-db')
  .then(() => {
    log('✓ Server is running\n', 'green');
    runVerification();
  })
  .catch(() => {
    log('✗ Server is not running!', 'red');
    log('\nPlease start the development server first:', 'yellow');
    log('  cd nas', 'cyan');
    log('  npm run dev', 'cyan');
    log('\nThen run this script again.\n', 'yellow');
    process.exit(1);
  });
