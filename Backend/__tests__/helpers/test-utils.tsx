/**
 * 🧪 UTILIDADES DE TESTING
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock del AuthProvider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

// Configuración de QueryClient para tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Wrapper personalizado para tests
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>{children}</MockAuthProvider>
    </QueryClientProvider>
  );
};

// Función de render personalizada
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar todo de testing-library
export * from '@testing-library/react';

// Sobrescribir render method
export { customRender as render };

// Utilidades adicionales
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
  user_type: 'inquilino' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockProperty = {
  id: 'test-property-id',
  title: 'Test Property',
  description: 'A test property',
  type: 'APARTMENT' as const,
  status: 'AVAILABLE' as const,
  price: 100000,
  currency: 'ARS',
  images: ['https://test.com/image1.jpg'],
  featured: false,
  userId: 'test-user-id',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// Helper para crear mocks de API responses
export const createMockApiResponse = <T>(data: T, success = true) => ({
  data: success ? data : undefined,
  error: success ? undefined : 'Test error',
  message: success ? 'Success' : 'Error',
  success,
});

// Helper para simular delays en tests
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para crear eventos de formulario
export const createFormEvent = (name: string, value: string) => ({
  target: { name, value },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});
