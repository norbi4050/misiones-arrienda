const http = require('http');

function findValidProperty(limit = 10, attempt = 1) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/properties?limit=${limit}&orderBy=createdAt&order=desc`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`\n=== API RESPONSE ATTEMPT ${attempt} ===`);
        console.log(`Total items found: ${response.items ? response.items.length : 0}`);

        if (response.items && response.items.length > 0) {
          // Find first property that is PUBLISHED and active
          const validProperty = response.items.find(property => {
            const status = property.status;
            const isActive = property.isActive ?? property.is_active ?? true;
            return status === 'PUBLISHED' && isActive === true;
          });

          if (validProperty) {
            console.log('\n=== VALID PROPERTY ID FOUND ===');
            console.log(`ID: ${validProperty.id}`);
            console.log(`Status: ${validProperty.status}`);
            console.log(`isActive: ${validProperty.isActive || validProperty.is_active}`);
            console.log(`Title: ${validProperty.title}`);
            console.log(`\n=== BUCKET PATH CONFIRMATION ===`);
            console.log(`Ruta del bucket: property-images/${validProperty.id}/`);
            console.log(`(Esta es la ruta de fallback que usa el sistema para las imágenes)`);
            return;
          } else {
            console.log('No valid PUBLISHED + active properties found in this batch');
            if (attempt < 3) {
              console.log(`Trying again with higher limit... (attempt ${attempt + 1})`);
              findValidProperty(limit + 10, attempt + 1);
            } else {
              console.log('\n=== NO VALID PROPERTIES FOUND ===');
              console.log('Could not find any property with status=PUBLISHED and isActive=true');
              console.log('You may need to seed the database with published properties first.');
            }
          }
        } else {
          console.log('No properties found via API');
          if (attempt < 3) {
            console.log(`Trying again with higher limit... (attempt ${attempt + 1})`);
            findValidProperty(limit + 10, attempt + 1);
          } else {
            console.log('\n=== NO PROPERTIES FOUND ===');
            console.log('The API returned no properties. Check if the server is running and database is seeded.');
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request failed:', error.message);
    console.log('Make sure the Next.js server is running on localhost:3000');
  });

  req.end();
}

// Start the search
console.log('Searching for a valid property (PUBLISHED + isActive=true)...');
findValidProperty();
