const { PrismaClient } = require('@prisma/client');

async function testEnvironment() {
  console.log('🔍 Testing Environment Variables Configuration...\n');

  // Test environment variables
  console.log('📋 Environment Variables Status:');
  console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : '❌ Missing');
  console.log('✅ DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : '❌ Missing');
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : '❌ Missing');
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : '❌ Missing');
  console.log('✅ JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : '❌ Missing');
  console.log('✅ NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'Using default');
  
  // Optional variables
  console.log('\n📧 Email Configuration (Optional):');
  console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || '❌ Not configured');
  console.log('📧 SMTP_USER:', process.env.SMTP_USER || '❌ Not configured');
  
  console.log('\n💳 MercadoPago Configuration (Optional):');
  console.log('💳 MERCADOPAGO_ENVIRONMENT:', process.env.MERCADOPAGO_ENVIRONMENT || '❌ Not configured');
  console.log('💳 MERCADOPAGO_SANDBOX_ACCESS_TOKEN:', process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN ? 'Set' : '❌ Not configured');

  // Test database connection
  console.log('\n🗄️ Testing Database Connection...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful! Found ${userCount} users.`);
    
    const propertyCount = await prisma.property.count();
    console.log(`✅ Database query successful! Found ${propertyCount} properties.`);
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Suggestion: Check your DATABASE_URL and internet connection');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Suggestion: Check your database credentials');
    } else if (error.message.includes('SSL')) {
      console.log('\n💡 Suggestion: Ensure SSL is properly configured');
    }
  } finally {
    await prisma.$disconnect();
  }

  // Test Supabase configuration
  console.log('\n🔐 Testing Supabase Configuration...');
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase API connection successful!');
      } else {
        console.log('❌ Supabase API connection failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Supabase API test failed:', error.message);
    }
  } else {
    console.log('❌ Supabase configuration incomplete');
  }

  console.log('\n🎉 Environment test completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. If database connection failed, check your credentials');
  console.log('2. Update JWT_SECRET with a strong secret key');
  console.log('3. Configure email settings if needed');
  console.log('4. Configure MercadoPago if you want payment features');
  console.log('5. Run "npm run dev" to start the development server');
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testEnvironment().catch(console.error);
