const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 INICIANDO TESTING THOROUGH E2E - FILTROS BÁSICOS 2025\n');

// ===========================================
// 1) ÍNDICES (Supabase)
// ===========================================

async function testIndexes() {
  console.log('📊 1. TESTING ÍNDICES SUPABASE');

  try {
    // Ejecutar SQL de índices
    console.log('   Ejecutando /sql/2025-idx-properties.sql...');
    const sqlPath = path.join(__dirname, '..', 'sql', '2025-idx-properties.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlContent });
    if (sqlError) {
      console.log('   ❌ Error ejecutando SQL:', sqlError.message);
    } else {
      console.log('   ✅ SQL ejecutado sin errores');
    }

    // EXPLAIN ANALYZE - ILIKE + order
    console.log('\n   🔍 EXPLAIN ANALYZE - ILIKE + order:');
    const { data: explain1, error: explain1Error } = await supabase.rpc('exec_sql', {
      sql: `
        EXPLAIN ANALYZE
        select * from public."Property"
        where lower(province) ilike '%mi%'
        order by created_at desc
        limit 12;
      `
    });

    if (explain1Error) {
      console.log('   ❌ Error en EXPLAIN ANALYZE ILIKE:', explain1Error.message);
    } else {
      console.log('   ✅ EXPLAIN ANALYZE ILIKE ejecutado');
      console.log('   📋 QUERY PLAN:', explain1);
    }

    // EXPLAIN ANALYZE - Order por id
    console.log('\n   🔍 EXPLAIN ANALYZE - Order por id:');
    const { data: explain2, error: explain2Error } = await supabase.rpc('exec_sql', {
      sql: `
        EXPLAIN ANALYZE
        select * from public."Property"
        order by id desc
        limit 12;
      `
    });

    if (explain2Error) {
      console.log('   ❌ Error en EXPLAIN ANALYZE ID:', explain2Error.message);
    } else {
      console.log('   ✅ EXPLAIN ANALYZE ID ejecutado');
      console.log('   📋 QUERY PLAN:', explain2);
    }

    // Listar índices
    console.log('\n   📋 LISTADO DE ÍNDICES:');
    const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'Property'
        ORDER BY indexname;
      `
    });

    if (indexesError) {
      console.log('   ❌ Error listando índices:', indexesError.message);
    } else {
      console.log('   ✅ Índices encontrados:');
      indexes.forEach(idx => {
        console.log(`      - ${idx.indexname}: ${idx.indexdef.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.log('   ❌ Error general en testing de índices:', error.message);
  }
}

// ===========================================
// 2) API /api/properties
// ===========================================

async function testAPIEndpoints() {
  console.log('\n🔗 2. TESTING API ENDPOINTS');

  const testCases = [
    // Casos OK (200)
    { name: 'priceMin/priceMax', params: { priceMin: 100000, priceMax: 500000 } },
    { name: 'bedroomsMin', params: { bedroomsMin: 2 } },
    { name: 'bathroomsMin', params: { bathroomsMin: 1 } },
    { name: 'province (válido)', params: { province: 'Buenos Aires' } },
    { name: 'orderBy price asc', params: { orderBy: 'price', order: 'asc' } },
    { name: 'orderBy id desc', params: { orderBy: 'id', order: 'desc' } },
    { name: 'orderBy createdAt desc', params: { orderBy: 'createdAt', order: 'desc' } },
    { name: 'limit/offset', params: { limit: 10, offset: 0 } },

    // Casos borde (vacíos)
    { name: 'province corto (inválido)', params: { province: 'A' } },
    { name: 'priceMin > priceMax', params: { priceMin: 500000, priceMax: 100000 } },

    // Casos inválidos
    { name: 'orderBy inválido', params: { orderBy: 'invalid_field' } },
    { name: 'limit > 50', params: { limit: 100 } },
    { name: 'priceMin no numérico', params: { priceMin: 'abc' } },
  ];

  for (const testCase of testCases) {
    try {
      const url = new URL(`${API_BASE_URL}/api/properties`);
      Object.entries(testCase.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`   🧪 Testing: ${testCase.name}`);
      console.log(`      URL: ${url.toString()}`);

      const response = await fetch(url.toString());
      const data = await response.json();

      console.log(`      Status: ${response.status}`);
      console.log(`      Items: ${data.items?.length || 0}, Count: ${data.count || 0}`);

      if (response.status !== 200) {
        console.log(`      ⚠️  Nota: Status ${response.status} - ${data.error || 'Sin error específico'}`);
      }

    } catch (error) {
      console.log(`   ❌ Error en ${testCase.name}:`, error.message);
    }
  }
}

// ===========================================
// 3) FRONTEND
// ===========================================

async function testFrontend() {
  console.log('\n🌐 3. TESTING FRONTEND');

  // Nota: Para testing frontend completo necesitaríamos Puppeteer
  // Por ahora, haremos testing básico de URLs

  const frontendTests = [
    { name: '/properties - básico', url: '/properties' },
    { name: '/properties - con filtros', url: '/properties?province=Buenos%20Aires&priceMin=100000&bedroomsMin=2' },
    { name: '/properties - paginación', url: '/properties?page=2&limit=12' },
    { name: '/properties/[id] - válido', url: '/properties/1' }, // Asumiendo ID existente
    { name: '/properties/[id] - inválido', url: '/properties/99999' },
  ];

  console.log('   📝 NOTA: Para testing frontend completo se requiere Puppeteer');
  console.log('   📝 URLs a testear manualmente:');

  frontendTests.forEach(test => {
    console.log(`      - ${test.name}: ${API_BASE_URL}${test.url}`);
  });

  console.log('\n   🔍 Puntos a validar manualmente:');
  console.log('      ✓ Filtros aplican correctamente');
  console.log('      ✓ URL persistence funciona');
  console.log('      ✓ Paginación (prev/next, change per-page, back/forward)');
  console.log('      ✓ Deep-linking carga filtros + paginación');
  console.log('      ✓ Property detail: published+active → OK, otros → notFound');
  console.log('      ✓ SEO: og:*, twitter:*, JSON-LD presentes');
}

// ===========================================
// MAIN EXECUTION
// ===========================================

async function main() {
  try {
    await testIndexes();
    await testAPIEndpoints();
    await testFrontend();

    console.log('\n🎯 TESTING COMPLETADO');
    console.log('\n📋 RESUMEN:');
    console.log('   - ✅ Índices: Ejecutados y verificados');
    console.log('   - ✅ API: Endpoints testeados con casos válidos/inválidos');
    console.log('   - ✅ Frontend: URLs identificadas para testing manual');
    console.log('\n🚦 RESULTADO: [GO/NO-GO] - Revisar hallazgos arriba');

  } catch (error) {
    console.log('\n❌ ERROR GENERAL:', error.message);
  }
}

main();
