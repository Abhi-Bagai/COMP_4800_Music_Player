/**
 * Simple test script to verify backend API endpoints
 * 
 * Usage:
 *   node test-api.js
 * 
 * Make sure the backend server is running first:
 *   npm run dev
 */

const API_BASE_URL = process.env.API_BASE_URL

async function testEndpoint(name, path, options = {}) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   GET ${API_BASE_URL}${path}`);
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success (${response.status})`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`   ❌ Failed (${response.status})`);
      console.log(`   Error:`, JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log(`📍 Base URL: ${API_BASE_URL}\n`);

  // Test 1: Health check
  await testEndpoint('Health Check', '/test/health');

  // Test 2: Database connection
  await testEndpoint('Database Connection', '/test/db');

  // Test 3: Configuration check
  await testEndpoint('Configuration', '/test/config');

  // Test 4: Spotify status (will fail without auth, but tests endpoint exists)
  await testEndpoint('Spotify Status (requires auth)', '/api/spotify/status');

  console.log('\n✨ Tests complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. If health check passed, backend is running correctly');
  console.log('   2. If DB test passed, database connection is working');
  console.log('   3. If config test shows "configured", environment is set up');
  console.log('   4. Spotify endpoints require authentication (implement session middleware)');
}

// Run tests
runTests().catch(console.error);

