/**
 * 🧪 FIXTURES DE PROPIEDADES PARA TESTING
 */

import { Property } from '@/types';

export const testProperties: Property[] = [
  {
    id: 'property-1',
    title: 'Departamento en Centro',
    description: 'Hermoso departamento de 2 ambientes',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    price: 150000,
    currency: 'ARS',
    images: ['https://test.com/image1.jpg'],
    featured: false,
    userId: 'user-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'property-2',
    title: 'Casa en Barrio Norte',
    description: 'Casa de 3 dormitorios con jardín',
    type: 'HOUSE',
    status: 'AVAILABLE',
    price: 300000,
    currency: 'ARS',
    images: ['https://test.com/image2.jpg', 'https://test.com/image3.jpg'],
    featured: true,
    userId: 'user-2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export const createTestProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'test-property-id',
  title: 'Test Property',
  description: 'A test property',
  type: 'APARTMENT',
  status: 'AVAILABLE',
  price: 100000,
  currency: 'ARS',
  images: ['https://test.com/image.jpg'],
  featured: false,
  userId: 'test-user-id',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});
