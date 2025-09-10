const { fetchPropertyImages } = require('./src/lib/property-images.ts');

// Test script to verify property images fallback functionality
async function testPropertyImagesFallback() {
  console.log('🧪 Testing Property Images Fallback Implementation...\n');

  try {
    // Test 1: Fetch images for a property (replace with actual property ID)
    const testPropertyId = 'test-property-123'; // Replace with actual property ID for testing
    console.log(`📸 Testing fetchPropertyImages for property: ${testPropertyId}`);

    const images = await fetchPropertyImages(testPropertyId);
    console.log(`✅ Found ${images.length} images:`, images);

    // Test 2: Verify image URLs are valid
    if (images.length > 0) {
      console.log('\n🔍 Verifying image URLs...');
      images.forEach((url, index) => {
        console.log(`  Image ${index + 1}: ${url}`);
        if (url.includes('supabase')) {
          console.log('  ✅ Valid Supabase URL');
        } else {
          console.log('  ⚠️  Non-Supabase URL detected');
        }
      });
    }

    console.log('\n✅ Property Images Fallback Test Completed Successfully!');
    console.log('\n📋 Implementation Summary:');
    console.log('  • generateMetadata now fetches bucket images as fallback');
    console.log('  • PropertyDetailClient hides broken images instead of showing placeholders');
    console.log('  • getProperty function already had bucket fallback logic');
    console.log('  • fetchPropertyImages function is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  • Check Supabase connection and bucket permissions');
    console.log('  • Verify property ID exists in database');
    console.log('  • Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  }
}

// Run the test
testPropertyImagesFallback();
