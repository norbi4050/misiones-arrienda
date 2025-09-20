/**
 * Test E2E: Publica y Aparece
 * Objetivo: Evitar regresiones en publicación y listado
 * 
 * Flujo: Crear DRAFT → Publicar → Verificar que aparece en listado
 */

const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

describe('E2E: Properties Publish and List', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  let createdPropertyId = null;

  // Cleanup después de los tests
  afterAll(async () => {
    if (createdPropertyId) {
      console.log(`🧹 Cleanup: Property ${createdPropertyId} should be cleaned up manually if needed`);
    }
  });

  test('1) Crear DRAFT → 2) Publicar → 3) Verificar que aparece en listado', async () => {
    // ===== PASO 1: Crear DRAFT =====
    console.log('📝 PASO 1: Creando DRAFT...');
    
    const draftPayload = {
      title: `E2E Test Property ${Date.now()}`,
      city: 'Posadas',
      province: 'Misiones',
      price: 150000
    };

    const createResponse = await fetch(`${BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload)
    });

    // Verificar creación exitosa
    expect(createResponse.status).toBe(201);
    
    const createData = await createResponse.json();
    expect(createData).toHaveProperty('id');
    expect(createData).toHaveProperty('status', 'DRAFT');
    
    createdPropertyId = createData.id;
    console.log(`✅ DRAFT creado con ID: ${createdPropertyId}`);

    // ===== PASO 2: Publicar =====
    console.log('🚀 PASO 2: Publicando DRAFT...');
    
    const publishResponse = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Propiedad de prueba E2E publicada',
        address: 'Av. Test 123'
      })
    });

    // Verificar publicación exitosa
    expect(publishResponse.status).toBe(200);
    
    const publishData = await publishResponse.json();
    expect(publishData).toHaveProperty('id', createdPropertyId);
    expect(publishData).toHaveProperty('status', 'AVAILABLE');
    
    console.log(`✅ Propiedad publicada: ${publishData.status}`);

    // ===== PASO 3: Verificar que aparece en listado =====
    console.log('🔍 PASO 3: Verificando listado...');
    
    const listResponse = await fetch(`${BASE_URL}/api/properties`);
    
    // Verificar respuesta exitosa
    expect(listResponse.status).toBe(200);
    
    const listData = await listResponse.json();
    
    // ===== ASSERTION CRÍTICA: meta.dataSource debe ser 'db' =====
    expect(listData).toHaveProperty('meta');
    expect(listData.meta).toHaveProperty('dataSource', 'db');
    
    if (listData.meta.dataSource !== 'db') {
      throw new Error(`❌ REGRESIÓN DETECTADA: meta.dataSource = '${listData.meta.dataSource}', esperado 'db'`);
    }
    
    console.log(`✅ Fuente de datos correcta: ${listData.meta.dataSource}`);

    // ===== ASSERTION: La propiedad debe aparecer en el listado =====
    expect(listData).toHaveProperty('items');
    expect(Array.isArray(listData.items)).toBe(true);
    
    const foundProperty = listData.items.find(item => item.id === createdPropertyId);
    
    if (!foundProperty) {
      console.error('❌ Propiedades en listado:', listData.items.map(p => ({ id: p.id, title: p.title })));
      throw new Error(`❌ FALLO E2E: Propiedad ${createdPropertyId} NO aparece en listado después de publicar`);
    }
    
    // ===== ASSERTION: Verificar datos de la propiedad =====
    expect(foundProperty).toHaveProperty('status', 'AVAILABLE');
    expect(foundProperty).toHaveProperty('isActive', true);
    expect(foundProperty).toHaveProperty('title', draftPayload.title);
    expect(foundProperty).toHaveProperty('city', draftPayload.city);
    expect(foundProperty).toHaveProperty('price', draftPayload.price);
    
    console.log(`✅ Propiedad encontrada en listado:`, {
      id: foundProperty.id,
      title: foundProperty.title,
      status: foundProperty.status,
      isActive: foundProperty.isActive
    });

    console.log('🎉 TEST E2E EXITOSO: Crear → Publicar → Aparece en listado');
  }, 30000); // 30 segundos timeout para operaciones de red
});
