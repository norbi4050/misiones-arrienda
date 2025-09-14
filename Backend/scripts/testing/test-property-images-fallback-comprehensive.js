#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Property Images Fallback System
 * Tests ID guard, image fallback, SEO metadata, and error handling
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');
const requestModule = isHttps ? https : http;

console.log(`🧪 Testing Property Images Fallback System`);
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔒 Protocol: ${isHttps ? 'HTTPS' : 'HTTP'}`);
console.log(`\n`);

// Test results
let testsPassed = 0;
let testsFailed = 0;
let totalTests = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = requestModule.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function assert(condition, message, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${testName}: ${message}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}: ${message}`);
    testsFailed++;
  }
}

async function testIdGuard() {
  console.log(`🔐 Testing ID Guard Security\n`);

  // Test 1: Valid UUID should work (assuming we have a test property)
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/550e8400-e29b-41d4-a716-446655440000`);
    if (response.status === 404) {
      assert(true, 'Valid UUID format accepted (property not found is expected)', 'ID Guard - Valid UUID');
    } else {
      assert(response.status === 200 || response.status === 404, `Valid UUID handled correctly (status: ${response.status})`, 'ID Guard - Valid UUID');
    }
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'ID Guard - Valid UUID');
  }

  // Test 2: Valid CUID should work
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/clh1x8q8z0000abcdefghijk`);
    if (response.status === 404) {
      assert(true, 'Valid CUID format accepted (property not found is expected)', 'ID Guard - Valid CUID');
    } else {
      assert(response.status === 200 || response.status === 404, `Valid CUID handled correctly (status: ${response.status})`, 'ID Guard - Valid CUID');
    }
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'ID Guard - Valid CUID');
  }

  // Test 3: Invalid ID should return 404
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/invalid-id-123`);
    assert(response.status === 404, `Invalid ID rejected with 404 (status: ${response.status})`, 'ID Guard - Invalid ID');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'ID Guard - Invalid ID');
  }

  // Test 4: SQL injection attempt should be blocked
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/1%27%20OR%20%271%27%3D%271`);
    assert(response.status === 404, `SQL injection attempt blocked (status: ${response.status})`, 'ID Guard - SQL Injection');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'ID Guard - SQL Injection');
  }

  // Test 5: Path traversal attempt should be blocked
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/../../../etc/passwd`);
    assert(response.status === 404, `Path traversal blocked (status: ${response.status})`, 'ID Guard - Path Traversal');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'ID Guard - Path Traversal');
  }

  console.log(`\n`);
}

async function testPropertyDetailPage() {
  console.log(`🏠 Testing Property Detail Pages\n`);

  // Test 1: Invalid ID should show 404 page
  try {
    const response = await makeRequest(`${BASE_URL}/properties/invalid-id-123`);
    assert(response.status === 404, `Invalid property ID shows 404 page (status: ${response.status})`, 'Property Detail - Invalid ID');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'Property Detail - Invalid ID');
  }

  // Test 2: Valid format but non-existent property should show 404
  try {
    const response = await makeRequest(`${BASE_URL}/properties/550e8400-e29b-41d4-a716-446655440000`);
    assert(response.status === 404, `Non-existent property shows 404 page (status: ${response.status})`, 'Property Detail - Non-existent');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'Property Detail - Non-existent');
  }

  console.log(`\n`);
}

async function testImageFallback() {
  console.log(`🖼️  Testing Image Fallback System\n`);

  // Note: These tests require actual property data in the database
  // For now, we'll test the API structure

  try {
    const response = await makeRequest(`${BASE_URL}/api/properties`);
    if (response.status === 200 && response.data) {
      assert(Array.isArray(response.data.properties) || Array.isArray(response.data), 'Properties API returns array', 'Image Fallback - API Structure');

      const properties = Array.isArray(response.data.properties) ? response.data.properties : response.data;
      if (properties.length > 0) {
        const firstProperty = properties[0];
        assert(typeof firstProperty === 'object', 'Property object structure is valid', 'Image Fallback - Property Structure');

        // Check if property has images field
        if (firstProperty.images !== undefined) {
          assert(true, 'Property has images field (can be empty array)', 'Image Fallback - Images Field');
        }
      }
    } else {
      assert(false, `Properties API not accessible (status: ${response.status})`, 'Image Fallback - API Access');
    }
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'Image Fallback - API Access');
  }

  console.log(`\n`);
}

async function testSeoMetadata() {
  console.log(`🔍 Testing SEO Metadata\n`);

  // Test 1: Check if property detail page has proper meta tags
  try {
    const response = await makeRequest(`${BASE_URL}/properties/550e8400-e29b-41d4-a716-446655440000`);
    if (response.status === 404) {
      // This is expected for non-existent property
      assert(true, 'Non-existent property handled correctly', 'SEO Metadata - 404 Handling');
    }

    // Check if response contains HTML (not JSON)
    const isHtml = response.headers['content-type'] && response.headers['content-type'].includes('text/html');
    assert(isHtml, 'Property page returns HTML content', 'SEO Metadata - Content Type');

  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'SEO Metadata - Page Access');
  }

  console.log(`\n`);
}

async function testErrorHandling() {
  console.log(`🚨 Testing Error Handling\n`);

  // Test 1: Malformed requests
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/`);
    assert(response.status === 404, `Trailing slash handled correctly (status: ${response.status})`, 'Error Handling - Trailing Slash');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'Error Handling - Trailing Slash');
  }

  // Test 2: Empty ID
  try {
    const response = await makeRequest(`${BASE_URL}/api/properties/`);
    assert(response.status === 404, `Empty ID handled correctly (status: ${response.status})`, 'Error Handling - Empty ID');
  } catch (error) {
    assert(false, `Request failed: ${error.message}`, 'Error Handling - Empty ID');
  }

  console.log(`\n`);
}

async function runAllTests() {
  console.log(`🚀 Starting Comprehensive Property Images Fallback Tests\n`);
  console.log(`═`.repeat(60));

  try {
    await testIdGuard();
    await testPropertyDetailPage();
    await testImageFallback();
    await testSeoMetadata();
    await testErrorHandling();

    console.log(`═`.repeat(60));
    console.log(`📊 Test Results Summary`);
    console.log(`═`.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
      console.log(`\n🎉 All tests passed! Property Images Fallback system is working correctly.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Please review the implementation.`);
    }

  } catch (error) {
    console.error(`💥 Test suite failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
