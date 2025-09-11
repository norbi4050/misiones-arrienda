const fetch = require('node-fetch');

async function testPropertiesAPI() {
  try {
    console.log('Testing properties API...');
    
    const response = await fetch('http://localhost:3000/api/properties', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.status === 500) {
      console.log('ERROR 500 - Internal Server Error detected');
      try {
        const errorData = JSON.parse(text);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', text);
      }
    }
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testPropertiesAPI();
