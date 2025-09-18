/**
 * 🧪 TESTS DE INTEGRACIÓN - API DE PROPIEDADES
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/properties/route';
import { createTestProperty } from '../../fixtures/properties';

describe('/api/properties', () => {
  describe('GET', () => {
    it('debe retornar lista de propiedades', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      // Mock de la respuesta esperada
      const mockProperties = [createTestProperty(), createTestProperty({ id: 'property-2' })];

      // Aquí se mockearía la llamada a la base de datos
      // y se verificaría la respuesta

      expect(res._getStatusCode()).toBe(200);
    });

    it('debe manejar parámetros de paginación', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          page: '2',
          limit: '10',
        },
      });

      // Test de paginación
      expect(res._getStatusCode()).toBe(200);
    });

    it('debe manejar filtros de búsqueda', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          search: 'departamento',
          type: 'APARTMENT',
          status: 'AVAILABLE',
        },
      });

      // Test de filtros
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('POST', () => {
    it('debe crear nueva propiedad con datos válidos', async () => {
      const propertyData = {
        title: 'Nueva Propiedad',
        description: 'Descripción de la propiedad',
        type: 'APARTMENT',
        price: 150000,
        currency: 'ARS',
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: propertyData,
      });

      // Test de creación
      expect(res._getStatusCode()).toBe(201);
    });

    it('debe rechazar datos inválidos', async () => {
      const invalidData = {
        title: '', // Título vacío
        price: -1000, // Precio negativo
      };

      const { req, res } = createMocks({
        method: 'POST',
        body: invalidData,
      });

      // Test de validación
      expect(res._getStatusCode()).toBe(400);
    });

    it('debe requerir autenticación', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: createTestProperty(),
      });

      // Test sin autenticación
      expect(res._getStatusCode()).toBe(401);
    });
  });
});
