const fetch = require('node-fetch');

async function testPropertyDetailSEO() {
  try {
    console.log('🧪 Testing Property Detail SEO Implementation...\n');

    // Test with a sample property ID (you may need to adjust this)
    const propertyId = '1'; // Replace with an actual property ID from your database
    const url = `http://localhost:3000/properties/${propertyId}`;

    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url);
    const html = await response.text();

    console.log(`📊 Response Status: ${response.status}`);

    // Check for JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
    if (jsonLdMatch) {
      console.log('✅ JSON-LD RealEstateListing found');
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      console.log('📋 JSON-LD Schema:', JSON.stringify(jsonLd, null, 2));
    } else {
      console.log('❌ JSON-LD RealEstateListing not found');
    }

    // Check for OpenGraph meta tags
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/);
    const ogDescription = html.match(/<meta property="og:description" content="([^"]*)"/);
    const ogImage = html.match(/<meta property="og:image" content="([^"]*)"/);

    console.log('\n📱 OpenGraph Meta Tags:');
    console.log(`   Title: ${ogTitle ? '✅' : '❌'} ${ogTitle ? ogTitle[1] : ''}`);
    console.log(`   Description: ${ogDescription ? '✅' : '❌'} ${ogDescription ? ogDescription[1]?.substring(0, 50) + '...' : ''}`);
    console.log(`   Image: ${ogImage ? '✅' : '❌'} ${ogImage ? ogImage[1] : ''}`);

    // Check for Twitter meta tags
    const twitterCard = html.match(/<meta name="twitter:card" content="([^"]*)"/);
    const twitterTitle = html.match(/<meta name="twitter:title" content="([^"]*)"/);
    const twitterDescription = html.match(/<meta name="twitter:description" content="([^"]*)"/);
    const twitterImage = html.match(/<meta name="twitter:image" content="([^"]*)"/);

    console.log('\n🐦 Twitter Meta Tags:');
    console.log(`   Card: ${twitterCard ? '✅' : '❌'} ${twitterCard ? twitterCard[1] : ''}`);
    console.log(`   Title: ${twitterTitle ? '✅' : '❌'} ${twitterTitle ? twitterTitle[1] : ''}`);
    console.log(`   Description: ${twitterDescription ? '✅' : '❌'} ${twitterDescription ? twitterDescription[1]?.substring(0, 50) + '...' : ''}`);
    console.log(`   Image: ${twitterImage ? '✅' : '❌'} ${twitterImage ? twitterImage[1] : ''}`);

    // Check for title tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    console.log(`\n🏷️  Page Title: ${titleMatch ? '✅' : '❌'} ${titleMatch ? titleMatch[1] : ''}`);

    console.log('\n🎉 SEO Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPropertyDetailSEO();
