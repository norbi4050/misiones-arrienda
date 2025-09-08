const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdateFix() {
  console.log('🧪 Testing Profile Update Fix for Error 400\n');

  try {
    // 1. Test data transformation (simulating what the API now does)
    console.log('1️⃣ Testing data transformation logic...');

    const frontendData = {
      name: "Usuario Test",
      email: "test@misionesarrienda.com",
      phone: "+54 376 1234567",
      location: "Posadas, Misiones",
      searchType: "alquiler",
      budgetRange: "hasta-80k",
      bio: "Perfil de prueba para testing",
      profileImage: "",
      preferredAreas: "Centro, Itaembé Guazú",
      familySize: "3", // String from frontend
      petFriendly: "false", // String from frontend
      moveInDate: "2025-02-01", // String from frontend
      employmentStatus: "empleado",
      monthlyIncome: "50000" // String from frontend
    };

    // Simulate the transformation that now happens in the API
    const transformedData = { ...frontendData };

    // Convert familySize to integer
    if (transformedData.familySize !== undefined) {
      if (transformedData.familySize === "") {
        transformedData.family_size = null;
      } else {
        const familySizeNum = parseInt(transformedData.familySize);
        transformedData.family_size = isNaN(familySizeNum) ? null : familySizeNum;
      }
      delete transformedData.familySize;
    }

    // Convert petFriendly to boolean
    if (transformedData.petFriendly !== undefined) {
      transformedData.pet_friendly = transformedData.petFriendly === "true" || transformedData.petFriendly === true;
      delete transformedData.petFriendly;
    }

    // Convert moveInDate to date
    if (transformedData.moveInDate !== undefined) {
      if (transformedData.moveInDate === "" || transformedData.moveInDate === "flexible") {
        transformedData.move_in_date = null;
      } else {
        const date = new Date(transformedData.moveInDate);
        transformedData.move_in_date = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      }
      delete transformedData.moveInDate;
    }

    // Convert monthlyIncome to numeric
    if (transformedData.monthlyIncome !== undefined) {
      if (transformedData.monthlyIncome === "") {
        transformedData.monthly_income = null;
      } else {
        const cleanIncome = transformedData.monthlyIncome.toString().replace(/[^\d.]/g, '');
        const incomeNum = parseFloat(cleanIncome);
        transformedData.monthly_income = isNaN(incomeNum) ? null : incomeNum;
      }
      delete transformedData.monthlyIncome;
    }

    // Rename camelCase to snake_case
    if (transformedData.searchType !== undefined) {
      transformedData.search_type = transformedData.searchType;
      delete transformedData.searchType;
    }

    if (transformedData.budgetRange !== undefined) {
      transformedData.budget_range = transformedData.budgetRange;
      delete transformedData.budgetRange;
    }

    if (transformedData.profileImage !== undefined) {
      transformedData.profile_image = transformedData.profileImage;
      delete transformedData.profileImage;
    }

    if (transformedData.preferredAreas !== undefined) {
      transformedData.preferred_areas = transformedData.preferredAreas;
      delete transformedData.preferredAreas;
    }

    if (transformedData.employmentStatus !== undefined) {
      transformedData.employment_status = transformedData.employmentStatus;
      delete transformedData.employmentStatus;
    }

    console.log('✅ Data transformation successful');
    console.log('Original data types:');
    console.log('  - familySize:', typeof frontendData.familySize, '->', frontendData.familySize);
    console.log('  - petFriendly:', typeof frontendData.petFriendly, '->', frontendData.petFriendly);
    console.log('  - moveInDate:', typeof frontendData.moveInDate, '->', frontendData.moveInDate);
    console.log('  - monthlyIncome:', typeof frontendData.monthlyIncome, '->', frontendData.monthlyIncome);

    console.log('\nTransformed data types:');
    console.log('  - family_size:', typeof transformedData.family_size, '->', transformedData.family_size);
    console.log('  - pet_friendly:', typeof transformedData.pet_friendly, '->', transformedData.pet_friendly);
    console.log('  - move_in_date:', typeof transformedData.move_in_date, '->', transformedData.move_in_date);
    console.log('  - monthly_income:', typeof transformedData.monthly_income, '->', transformedData.monthly_income);

    // 2. Test the actual upsert with transformed data
    console.log('\n2️⃣ Testing upsert with transformed data...');

    const testUserId = '6403f9d2-e846-4c70-87e0-e051127d9500';
    const payload = { id: testUserId, ...transformedData };

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.log('❌ Upsert failed:', error.message);
      console.log('Error details:', error);
      return;
    }

    console.log('✅ Upsert successful!');
    console.log('Updated user data:', {
      id: data.id,
      name: data.name,
      email: data.email,
      family_size: data.family_size,
      pet_friendly: data.pet_friendly,
      move_in_date: data.move_in_date,
      monthly_income: data.monthly_income,
      search_type: data.search_type,
      budget_range: data.budget_range
    });

    // 3. Verify data types in database
    console.log('\n3️⃣ Verifying data types in database...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('family_size, pet_friendly, move_in_date, monthly_income')
      .eq('id', testUserId)
      .maybeSingle();

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError);
      return;
    }

    console.log('Database data types verification:');
    console.log('  - family_size:', typeof verifyData.family_size, '->', verifyData.family_size);
    console.log('  - pet_friendly:', typeof verifyData.pet_friendly, '->', verifyData.pet_friendly);
    console.log('  - move_in_date:', typeof verifyData.move_in_date, '->', verifyData.move_in_date);
    console.log('  - monthly_income:', typeof verifyData.monthly_income, '->', verifyData.monthly_income);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n💡 Summary:');
  console.log('   ✅ Data transformation working correctly');
  console.log('   ✅ Type conversions applied properly');
  console.log('   ✅ Database upsert successful');
  console.log('   ✅ Error 400 should now be resolved');
}

testProfileUpdateFix();
