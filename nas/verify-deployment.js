/**
 * Deployment Verification Script
 * 
 * This script verifies that the NAS application is properly deployed and functional.
 * Run this after deploying to Vercel to ensure everything works correctly.
 * 
 * Usage: node verify-deployment.js <deployment-url>
 * Example: node verify-deployment.js https://nas-project.vercel.app
 */

const https = require('https');
const http = require('http');

// Get deployment URL from command line argument
const deploymentUrl = process.argv[2];

if (!deploymentUrl) {
  console.error('❌ Error: Please provide a deployment URL');
  console.log('Usage: node verify-deployment.js <deployment-url>');
  console.log('Example: node verify-deployment.js https://nas-project.vercel.app');
  process.exit(1);
}

// Parse URL
let baseUrl;
try {
  const url = new URL(deploymentUrl);
  baseUrl = `${url.protocol}//${url.host}`;
} catch (error) {
  console.error('❌ Error: Invalid URL format');
  process.exit(1);
}

console.log('🚀 NAS Deployment Verification');
console.log('================================\n');
console.log(`Testing deployment at: ${baseUrl}\n`);

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * Make HTTP request
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NAS-Deployment-Verifier/1.0'
      }
    };
    
    const req = client.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Run a test
 */
async function runTest(name, testFn) {
  process.stdout.write(`Testing: ${name}... `);
  
  try {
    const result = await testFn();
    
    if (result.passed) {
      console.log('✅ PASSED');
      results.passed++;
    } else if (result.warning) {
      console.log('⚠️  WARNING:', result.message);
      results.warnings++;
    } else {
      console.log('❌ FAILED:', result.message);
      results.failed++;
    }
    
    results.tests.push({
      name,
      passed: result.passed,
      warning: result.warning,
      message: result.message
    });
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    results.failed++;
    results.tests.push({
      name,
      passed: false,
      message: error.message
    });
  }
}

/**
 * Main verification function
 */
async function verifyDeployment() {
  console.log('Running verification tests...\n');
  
  // Test 1: Homepage loads
  await runTest('Homepage loads', async () => {
    const response = await makeRequest('/');
    
    if (response.statusCode === 200) {
      return { passed: true };
    } else if (response.statusCode === 301 || response.statusCode === 302) {
      return { 
        warning: true, 
        message: `Redirects to ${response.headers.location}` 
      };
    } else {
      return { 
        passed: false, 
        message: `Expected 200, got ${response.statusCode}` 
      };
    }
  });
  
  // Test 2: Login page loads
  await runTest('Login page loads', async () => {
    const response = await makeRequest('/login');
    
    if (response.statusCode === 200) {
      return { passed: true };
    } else {
      return { 
        passed: false, 
        message: `Expected 200, got ${response.statusCode}` 
      };
    }
  });
  
  // Test 3: API health check
  await runTest('API responds', async () => {
    const response = await makeRequest('/api/dashboard');
    
    // Should return 401 (unauthorized) since we're not logged in
    if (response.statusCode === 401) {
      return { passed: true };
    } else if (response.statusCode === 200) {
      return { 
        warning: true, 
        message: 'API returned 200 without authentication (check auth)' 
      };
    } else {
      return { 
        passed: false, 
        message: `Expected 401, got ${response.statusCode}` 
      };
    }
  });
  
  // Test 4: Static assets load
  await runTest('Static assets accessible', async () => {
    const response = await makeRequest('/favicon.ico');
    
    if (response.statusCode === 200 || response.statusCode === 304) {
      return { passed: true };
    } else {
      return { 
        warning: true, 
        message: `Favicon not found (${response.statusCode})` 
      };
    }
  });
  
  // Test 5: HTTPS enabled
  await runTest('HTTPS enabled', async () => {
    const url = new URL(baseUrl);
    
    if (url.protocol === 'https:') {
      return { passed: true };
    } else {
      return { 
        warning: true, 
        message: 'Deployment is not using HTTPS' 
      };
    }
  });
  
  // Test 6: Security headers
  await runTest('Security headers present', async () => {
    const response = await makeRequest('/');
    const headers = response.headers;
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security'
    ];
    
    const missingHeaders = securityHeaders.filter(h => !headers[h]);
    
    if (missingHeaders.length === 0) {
      return { passed: true };
    } else {
      return { 
        warning: true, 
        message: `Missing headers: ${missingHeaders.join(', ')}` 
      };
    }
  });
  
  // Test 7: Next.js headers present
  await runTest('Next.js deployment detected', async () => {
    const response = await makeRequest('/');
    const headers = response.headers;
    
    if (headers['x-vercel-id'] || headers['server']?.includes('Vercel')) {
      return { passed: true };
    } else {
      return { 
        warning: true, 
        message: 'Vercel headers not detected' 
      };
    }
  });
  
  // Test 8: Protected routes redirect
  await runTest('Protected routes require auth', async () => {
    const response = await makeRequest('/dashboard');
    
    // Should redirect to login
    if (response.statusCode === 302 || response.statusCode === 307) {
      return { passed: true };
    } else if (response.statusCode === 401) {
      return { passed: true };
    } else if (response.statusCode === 200) {
      return { 
        warning: true, 
        message: 'Dashboard accessible without authentication' 
      };
    } else {
      return { 
        passed: false, 
        message: `Unexpected status: ${response.statusCode}` 
      };
    }
  });
  
  // Print summary
  console.log('\n================================');
  console.log('Verification Summary');
  console.log('================================\n');
  console.log(`✅ Passed:   ${results.passed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`❌ Failed:   ${results.failed}`);
  console.log(`📊 Total:    ${results.tests.length}\n`);
  
  if (results.failed === 0 && results.warnings === 0) {
    console.log('🎉 All tests passed! Deployment is healthy.\n');
    return 0;
  } else if (results.failed === 0) {
    console.log('✅ Deployment is functional with some warnings.\n');
    console.log('Warnings:');
    results.tests
      .filter(t => t.warning)
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
    console.log();
    return 0;
  } else {
    console.log('❌ Deployment has issues that need attention.\n');
    console.log('Failed tests:');
    results.tests
      .filter(t => !t.passed && !t.warning)
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
    console.log();
    return 1;
  }
}

// Run verification
verifyDeployment()
  .then(exitCode => {
    console.log('Verification complete.');
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Verification failed with error:', error.message);
    process.exit(1);
  });
