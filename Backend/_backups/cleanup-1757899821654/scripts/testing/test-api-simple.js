const http = require('http');

function testPropertiesAPI() {
  console.log('Testing properties API...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/properties',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      
      if (res.statusCode === 500) {
        console.log('ERROR 500 - Internal Server Error detected');
        try {
          const errorData = JSON.parse(data);
          console.log('Error details:', errorData);
        } catch (e) {
          console.log('Raw error response:', data);
        }
      }
    });
  });

  req.on('error', (error) => {
    console.error('Network error:', error.message);
  });

  req.end();
}

testPropertiesAPI();
