const fetch = require('node-fetch');

async function testPropertySeo() {
  try {
    console.log('🧪 Testing SEO Implementation for Property Detail Pages\n');

    // Test with a sample property ID (you'll need to replace this with an actual property ID)
    const propertyId = 'sample-property-id';
    const baseUrl = 'http://localhost:3000'; // Adjust if your dev server runs on different port

    console.log(`📡 Fetching property page: ${baseUrl}/properties/${propertyId}`);

    const response = await fetch(`${baseUrl}/properties/${propertyId}`);
    const html = await response.text();

    console.log('✅ Page fetched successfully');

    // Check for Open Graph meta tags
    const ogTitle = html.includes('property="og:title"');
    const ogDescription = html.includes('property="og:description"');
    const ogImage = html.includes('property="og:image"');
    const ogType = html.includes('property="og:type"');

    console.log('\n🔍 Open Graph Meta Tags:');
    console.log(`   og:title: ${ogTitle ? '✅' : '❌'}`);
    console.log(`   og:description: ${ogDescription ? '✅' : '❌'}`);
    console.log(`   og:image: ${ogImage ? '✅' : '❌'}`);
    console.log(`   og:type: ${ogType ? '✅' : '❌'}`);

    // Check for Twitter Card meta tags
    const twitterCard = html.includes('name="twitter:card"');
    const twitterTitle = html.includes('name="twitter:title"');
    const twitterDescription = html.includes('name="twitter:description"');
    const twitterImage = html.includes('name="twitter:image"');

    console.log('\n🐦 Twitter Card Meta Tags:');
    console.log(`   twitter:card: ${twitterCard ? '✅' : '❌'}`);
    console.log(`   twitter:title: ${twitterTitle ? '✅' : '❌'}`);
    console.log(`   twitter:description: ${twitterDescription ? '✅' : '❌'}`);
    console.log(`   twitter:image: ${twitterImage ? '✅' : '❌'}`);

    // Check for JSON-LD structured data
    const jsonLdPresent = html.includes('application/ld+json');
    const schemaOrg = html.includes('https://schema.org');

    console.log('\n📋 JSON-LD Structured Data:');
    console.log(`   JSON-LD script present: ${jsonLdPresent ? '✅' : '❌'}`);
    console.log(`   Schema.org context: ${schemaOrg ? '✅' : '❌'}`);

    // Extract and validate JSON-LD content
    if (jsonLdPresent) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonLdData = JSON.parse(jsonLdMatch[1]);
          console.log('\n📊 JSON-LD Validation:');
          console.log(`   @context: ${jsonLdData['@context'] === 'https://schema.org' ? '✅' : '❌'}`);
          console.log(`   @type: ${jsonLdData['@type'] ? '✅' : '❌'} (${jsonLdData['@type']})`);
          console.log(`   name: ${jsonLdData.name ? '✅' : '❌'}`);
          console.log(`   description: ${jsonLdData.description ? '✅' : '❌'}`);
          console.log(`   itemOffered: ${jsonLdData.itemOffered ? '✅' : '❌'}`);
        } catch (e) {
          console.log('❌ JSON-LD parsing failed:', e.message);
        }
      }
    }

    console.log('\n🎉 SEO Implementation Test Complete!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Replace "sample-property-id" with an actual property ID');
    console.log('   2. Ensure your Next.js dev server is running');
    console.log('   3. Test with different property types to verify JSON-LD mapping');
    console.log('   4. Use tools like Google Rich Results Test to validate structured data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure your Next.js server is running');
    console.log('   - Check that the property ID exists in your database');
    console.log('   - Verify the API endpoint is working correctly');
  }
}

// Run the test
testPropertySeo();
