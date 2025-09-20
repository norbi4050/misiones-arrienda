/**
 * Test Contrato GET /api/properties
 * Objetivo: Asegurar que TODOS los items cumplen el contrato esperado
 * 
 * Validaciones:
 * - Todos los items tienen status='AVAILABLE' y isActive=true
 * - Mapeo camelCase correcto: createdAt, propertyType, isActive
 * - meta.dataSource siempre 'db'
 */

const { describe, test, expect } = require('@jest/globals');

describe('API Contract: GET /api/properties', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  test('Contrato: Todos los items cumplen status=AVAILABLE y isActive=true', async () => {
    console.log('🔍 Verificando contrato de GET /api/properties...');
    
    const response = await fetch(`${BASE_URL}/api/properties`);
    
    // Verificar respuesta exitosa
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // ===== ASSERTION CRÍTICA: meta.dataSource debe ser 'db' =====
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('dataSource', 'db');
    
    if (data.meta.dataSource !== 'db') {
      throw new Error(`❌ REGRESIÓN: meta.dataSource = '${data.meta.dataSource}', esperado 'db'`);
    }
    
    console.log(`✅ Fuente de datos correcta: ${data.meta.dataSource}`);

    // ===== ASSERTION: Estructura de respuesta =====
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('count');
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.count).toBe('number');
    
    console.log(`📊 Items encontrados: ${data.items.length}, Count: ${data.count}`);

    // Si no hay items, el test pasa (lista vacía es válida)
    if (data.items.length === 0) {
      console.log('ℹ️ Lista vacía - Test pasa (no hay items para validar)');
      return;
    }

    // ===== ASSERTION: TODOS los items deben cumplir el contrato =====
    data.items.forEach((item, index) => {
      console.log(`🔍 Validando item ${index + 1}/${data.items.length}: ${item.id}`);
      
      // ===== FILTROS RESTRICTIVOS: status y isActive =====
      expect(item).toHaveProperty('status', 'AVAILABLE');
      expect(item).toHaveProperty('isActive', true);
      
      if (item.status !== 'AVAILABLE') {
        throw new Error(`❌ VIOLACIÓN CONTRATO: Item ${item.id} tiene status='${item.status}', esperado 'AVAILABLE'`);
      }
      
      if (item.isActive !== true) {
        throw new Error(`❌ VIOLACIÓN CONTRATO: Item ${item.id} tiene isActive=${item.isActive}, esperado true`);
      }

      // ===== MAPEO CAMELCASE: Campos obligatorios =====
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('city');
      expect(item).toHaveProperty('province');
      
      // ===== MAPEO CAMELCASE ESPECÍFICO =====
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('propertyType');
      expect(item).toHaveProperty('isActive');
      
      // Verificar que NO tiene snake_case (regresión)
      expect(item).not.toHaveProperty('created_at');
      expect(item).not.toHaveProperty('property_type');
      expect(item).not.toHaveProperty('is_active');
      
      // ===== TIPOS DE DATOS =====
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.price).toBe('number');
      expect(typeof item.city).toBe('string');
      expect(typeof item.province).toBe('string');
      expect(typeof item.propertyType).toBe('string');
      expect(typeof item.isActive).toBe('boolean');
      expect(typeof item.createdAt).toBe('string');
      
      // ===== VALORES VÁLIDOS =====
      expect(item.price).toBeGreaterThan(0);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.city.length).toBeGreaterThan(0);
      
      // ===== ARRAYS =====
      if (item.images) {
        expect(Array.isArray(item.images)).toBe(true);
      }
    });
    
    console.log(`✅ TODOS los ${data.items.length} items cumplen el contrato`);
    console.log('🎉 TEST CONTRATO EXITOSO');
  }, 15000); // 15 segundos timeout

  test('Contrato: Filtros aplicados correctamente', async () => {
    console.log('🔍 Verificando filtros en GET /api/properties...');
    
    // Test con filtro de ciudad
    const responseWithFilter = await fetch(`${BASE_URL}/api/properties?city=Posadas`);
    expect(responseWithFilter.status).toBe(200);
    
    const dataWithFilter = await responseWithFilter.json();
    
    // Verificar que meta refleja los filtros
    expect(dataWithFilter.meta).toHaveProperty('filters');
    expect(dataWithFilter.meta.filters).toHaveProperty('city', 'Posadas');
    
    // Verificar que todos los items cumplen el filtro (si hay items)
    if (dataWithFilter.items.length > 0) {
      dataWithFilter.items.forEach(item => {
        expect(item.city.toLowerCase()).toContain('posadas');
      });
    }
    
    console.log(`✅ Filtros aplicados correctamente: ${dataWithFilter.items.length} items con city=Posadas`);
  }, 10000);

  test('Contrato: Paginación funciona', async () => {
    console.log('🔍 Verificando paginación en GET /api/properties...');
    
    const responseWithPagination = await fetch(`${BASE_URL}/api/properties?page=1&limit=5`);
    expect(responseWithPagination.status).toBe(200);
    
    const dataWithPagination = await responseWithPagination.json();
    
    // Verificar meta de paginación
    expect(dataWithPagination.meta).toHaveProperty('pagination');
    expect(dataWithPagination.meta.pagination).toHaveProperty('page', 1);
    expect(dataWithPagination.meta.pagination).toHaveProperty('pageSize', 5);
    
    // Verificar que no devuelve más items que el límite
    expect(dataWithPagination.items.length).toBeLessThanOrEqual(5);
    
    console.log(`✅ Paginación funciona: ${dataWithPagination.items.length} items (límite 5)`);
  }, 10000);
});
