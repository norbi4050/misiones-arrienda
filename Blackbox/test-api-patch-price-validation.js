const http = require('http');

// Test cases for the API patch
const testCases = [
  {
    name: 'priceMin > priceMax (should return 400)',
    url: 'http://localhost:3000/api/properties?priceMin=500000&priceMax=100000',
    expectedStatus: 400,
    expectedError: 'priceMin must be <= priceMax'
  },
  {
    name: 'priceMin < priceMax (should return 200)',
    url: 'http://localhost:3000/api/properties?priceMin=100000&priceMax=500000',
    expectedStatus: 200
  },
  {
    name: 'city with 1 char (should return 200, no filter)',
    url: 'http://localhost:3000/api/properties?city=P',
    expectedStatus: 200
  },
  {
    name: 'province with 2 chars (should return 200, with filter)',
    url: 'http://localhost:3000/api/properties?province=Po',
    expectedStatus: 200
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            data: JSON.parse(data)
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 TESTING API PATCH - PRICE VALIDATION & GUARDS\n');
  console.log('=' .repeat(60));

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);

    try {
      const response = await makeRequest(testCase.url);

      console.log(`Status: ${response.statusCode}`);
      console.log(`Expected: ${testCase.expectedStatus}`);

      if (response.statusCode === testCase.expectedStatus) {
        console.log('✅ PASS');

        if (testCase.expectedError) {
          if (response.data.error === testCase.expectedError) {
            console.log(`✅ Error message correct: "${response.data.error}"`);
          } else {
            console.log(`❌ Wrong error message. Expected: "${testCase.expectedError}", Got: "${response.data.error}"`);
          }
        }

        // Additional checks for successful responses
        if (response.statusCode === 200) {
          const itemsLength = response.data.items ? response.data.items.length : 0;
          const count = response.data.count || 0;
          console.log(`📊 Results: items=${itemsLength}, count=${count}`);
        }

      } else {
        console.log('❌ FAIL');
        console.log(`Expected status ${testCase.expectedStatus}, got ${response.statusCode}`);
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }

    console.log('-'.repeat(40));
  }

  console.log('\n🏁 TESTING COMPLETED');
  console.log('=' .repeat(60));
}

// Run tests
runTests().catch(console.error);
