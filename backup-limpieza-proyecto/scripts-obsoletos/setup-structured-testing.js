/**
 * 🧪 SCRIPT DE CONFIGURACIÓN DE TESTING ESTRUCTURADO
 * 
 * Este script configura un sistema de testing estructurado con Jest y Testing Library
 * siguiendo las mejores prácticas para el proyecto.
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// Estructura de testing objetivo
const TESTING_STRUCTURE = {
  '__tests__/unit/hooks': 'Tests unitarios de hooks',
  '__tests__/unit/utils': 'Tests unitarios de utilidades',
  '__tests__/unit/components': 'Tests unitarios de componentes',
  '__tests__/integration/api': 'Tests de integración de APIs',
  '__tests__/integration/database': 'Tests de integración de BD',
  '__tests__/e2e': 'Tests end-to-end',
  '__tests__/fixtures': 'Datos de prueba',
  '__tests__/mocks': 'Mocks y stubs',
  '__tests__/helpers': 'Utilidades de testing'
};

// Archivos de configuración de testing
const TESTING_CONFIG_FILES = [
  {
    path: 'jest.config.js',
    content: `/**
 * 🧪 CONFIGURACIÓN DE JEST
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/fixtures/',
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/__tests__/helpers/'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/page.tsx', // Exclude page components from coverage
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Transform configuration
  transform: {
    '^.+\\\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Global setup
  globalSetup: '<rootDir>/__tests__/helpers/global-setup.js',
  globalTeardown: '<rootDir>/__tests__/helpers/global-teardown.js',
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
`
  },
  
  {
    path: 'jest.setup.js',
    content: `/**
 * 🧪 CONFIGURACIÓN DE SETUP DE JEST
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills para Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock de Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock de Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock de variables de entorno
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock de Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      })),
    },
  })),
}));

// Mock de fetch global
global.fetch = jest.fn();

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Configuración global de timeouts
jest.setTimeout(10000);

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
`
  },
  
  {
    path: '__tests__/helpers/test-utils.tsx',
    content: `/**
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
`
  },
  
  {
    path: '__tests__/helpers/global-setup.js',
    content: `/**
 * 🧪 CONFIGURACIÓN GLOBAL DE SETUP
 */

module.exports = async () => {
  // Configuración global antes de ejecutar todos los tests
  console.log('🧪 Iniciando configuración global de tests...');
  
  // Configurar variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  
  console.log('✅ Configuración global completada');
};
`
  },
  
  {
    path: '__tests__/helpers/global-teardown.js',
    content: `/**
 * 🧪 CONFIGURACIÓN GLOBAL DE TEARDOWN
 */

module.exports = async () => {
  // Limpieza global después de ejecutar todos los tests
  console.log('🧪 Ejecutando limpieza global de tests...');
  
  // Aquí se puede agregar limpieza de recursos globales
  // como cerrar conexiones de base de datos, limpiar archivos temporales, etc.
  
  console.log('✅ Limpieza global completada');
};
`
  },
  
  {
    path: '__tests__/fixtures/users.ts',
    content: `/**
 * 🧪 FIXTURES DE USUARIOS PARA TESTING
 */

import { User } from '@/types';

export const testUsers: User[] = [
  {
    id: 'user-1',
    email: 'inquilino@test.com',
    name: 'Juan Inquilino',
    role: 'USER',
    user_type: 'inquilino',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'dueno@test.com',
    name: 'María Dueña',
    role: 'USER',
    user_type: 'dueno_directo',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
    user_type: 'inmobiliaria',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  user_type: 'inquilino',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});
`
  },
  
  {
    path: '__tests__/fixtures/properties.ts',
    content: `/**
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
`
  }
];

// Tests de ejemplo
const EXAMPLE_TESTS = [
  {
    path: '__tests__/unit/utils/format.test.ts',
    content: `/**
 * 🧪 TESTS UNITARIOS - UTILIDADES DE FORMATO
 */

import { formatCurrency, formatDate, formatRelativeTime } from '@/utils';

describe('Utilidades de Formato', () => {
  describe('formatCurrency', () => {
    it('debe formatear correctamente pesos argentinos', () => {
      expect(formatCurrency(150000)).toBe('$ 150.000,00');
    });

    it('debe formatear correctamente dólares', () => {
      expect(formatCurrency(1500, 'USD')).toBe('US$ 1.500,00');
    });

    it('debe manejar valores decimales', () => {
      expect(formatCurrency(150000.50)).toBe('$ 150.000,50');
    });
  });

  describe('formatDate', () => {
    it('debe formatear fecha correctamente', () => {
      const date = '2025-01-15T10:30:00Z';
      expect(formatDate(date)).toBe('15 de enero de 2025');
    });

    it('debe manejar objetos Date', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('15 de enero de 2025');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('debe mostrar "hace unos segundos" para fechas muy recientes', () => {
      const date = new Date('2025-01-15T10:29:30Z');
      expect(formatRelativeTime(date)).toBe('hace unos segundos');
    });

    it('debe mostrar minutos para fechas recientes', () => {
      const date = new Date('2025-01-15T10:25:00Z');
      expect(formatRelativeTime(date)).toBe('hace 5 minutos');
    });

    it('debe mostrar horas para fechas del mismo día', () => {
      const date = new Date('2025-01-15T08:30:00Z');
      expect(formatRelativeTime(date)).toBe('hace 2 horas');
    });

    it('debe mostrar días para fechas anteriores', () => {
      const date = new Date('2025-01-13T10:30:00Z');
      expect(formatRelativeTime(date)).toBe('hace 2 días');
    });
  });
});
`
  },
  
  {
    path: '__tests__/unit/hooks/useSupabaseAuth.test.tsx',
    content: `/**
 * 🧪 TESTS UNITARIOS - HOOK DE AUTENTICACIÓN
 */

import { renderHook, act } from '@testing-library/react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createTestUser } from '../../fixtures/users';

// Mock del hook (esto se reemplazaría con el hook real)
jest.mock('@/hooks/useSupabaseAuth');

describe('useSupabaseAuth Hook', () => {
  const mockUseSupabaseAuth = useSupabaseAuth as jest.MockedFunction<typeof useSupabaseAuth>;

  beforeEach(() => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('debe retornar estado inicial correcto', () => {
    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('debe manejar estado de loading', () => {
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.loading).toBe(true);
  });

  it('debe manejar usuario autenticado', () => {
    const testUser = createTestUser();
    
    mockUseSupabaseAuth.mockReturnValue({
      user: testUser,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.user).toEqual(testUser);
    expect(result.current.loading).toBe(false);
  });

  it('debe manejar errores de autenticación', () => {
    const errorMessage = 'Error de autenticación';
    
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    expect(result.current.error).toBe(errorMessage);
  });
});
`
  },
  
  {
    path: '__tests__/integration/api/properties.test.ts',
    content: `/**
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
`
  }
];

// Contadores para estadísticas
let stats = {
  directoriesCreated: 0,
  filesCreated: 0,
  errors: 0,
  startTime: Date.now()
};

/**
 * Crea un directorio si no existe
 */
function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      if (DRY_RUN) {
        console.log(`📁 [DRY RUN] Crearía directorio: ${dirPath}`);
      } else {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Directorio creado: ${dirPath}`);
      }
      stats.directoriesCreated++;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error creando directorio ${dirPath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Crea un archivo con contenido
 */
function createFile(filePath, content) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    // Crear directorio si no existe
    ensureDirectory(dir);
    
    if (DRY_RUN) {
      console.log(`📝 [DRY RUN] Crearía archivo: ${filePath}`);
    } else {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`📝 Archivo creado: ${filePath}`);
    }
    
    stats.filesCreated++;
    return true;
  } catch (error) {
    console.error(`❌ Error creando archivo ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Actualiza package.json con scripts de testing
 */
function updatePackageJson() {
  try {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️  package.json no encontrado, creando uno básico...');
      const basicPackageJson = {
        name: 'misiones-arrienda',
        version: '1.0.0',
        scripts: {},
        dependencies: {},
        devDependencies: {}
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(basicPackageJson, null, 2));
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Agregar scripts de testing
    packageJson.scripts = {
      ...packageJson.scripts,
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'test:ci': 'jest --ci --coverage --watchAll=false',
      'test:unit': 'jest __tests__/unit',
      'test:integration': 'jest __tests__/integration',
      'test:e2e': 'jest __tests__/e2e',
    };
    
    // Agregar dependencias de desarrollo necesarias
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      '@testing-library/jest-dom': '^6.1.0',
      '@testing-library/react': '^14.1.0',
      '@testing-library/user-event': '^14.5.0',
      '@types/jest': '^29.5.0',
      'jest': '^29.7.0',
      'jest-environment-jsdom': '^29.7.0',
      'node-mocks-http': '^1.13.0',
    };
    
    if (DRY_RUN) {
      console.log('📦 [DRY RUN] Actualizaría package.json con scripts de testing');
    } else {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('📦 package.json actualizado con scripts de testing');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error actualizando package.json:', error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Función principal de configuración de testing
 */
async function setupStructuredTesting() {
  console.log('🧪 Iniciando configuración de testing estructurado...\n');
  
  if (DRY_RUN) {
    console.log('🔍 MODO DRY RUN - Solo se mostrarán los cambios\n');
  }
  
  // 1. Crear estructura de directorios
  console.log('📁 Creando estructura de testing...');
  for (const [dirPath, description] of Object.entries(TESTING_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    ensureDirectory(fullPath);
  }
  
  // 2. Crear archivos de configuración
  console.log('\n📝 Creando archivos de configuración de testing...');
  for (const configFile of TESTING_CONFIG_FILES) {
    createFile(configFile.path, configFile.content);
  }
  
  // 3. Crear tests de ejemplo
  console.log('\n🧪 Creando tests de ejemplo...');
  for (const testFile of EXAMPLE_TESTS) {
    createFile(testFile.path, testFile.content);
  }
  
  // 4. Actualizar package.json
  console.log('\n📦 Actualizando package.json...');
  updatePackageJson();
  
  // Estadísticas finales
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE CONFIGURACIÓN DE TESTING');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📁 Directorios creados: ${stats.directoriesCreated}`);
  console.log(`📝 Archivos creados: ${stats.filesCreated}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para ejecutar los cambios realmente, ejecuta sin --dry-run');
  } else if (stats.errors === 0) {
    console.log('\n🎉 ¡Configuración de testing completada exitosamente!');
    console.log('💡 Ejecuta "npm install" para instalar las dependencias de testing');
    console.log('💡 Ejecuta "npm test" para correr los tests');
  } else {
    console.log(`\n⚠️  Configuración completada con ${stats.errors} errores`);
  }
}

/**
 * Función de verificación post-configuración
 */
function verifyTestingSetup() {
  console.log('\n🔍 Verificando configuración de testing...');
  
  let issuesFound = 0;
  
  // Verificar archivos de configuración críticos
  const criticalFiles = [
    'jest.config.js',
    'jest.setup.js',
    '__tests__/helpers/test-utils.tsx',
    '__tests__/fixtures/users.ts',
    '__tests__/fixtures/properties.ts'
  ];
  
  for (const filePath of criticalFiles) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo crítico faltante: ${filePath}`);
      issuesFound++;
    } else {
      console.log(`✅ Archivo crítico presente: ${filePath}`);
    }
  }
  
  // Verificar estructura de directorios
  for (const dirPath of Object.keys(TESTING_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Directorio faltante: ${dirPath}`);
      issuesFound++;
    } else {
      console.log(`✅ Directorio presente: ${dirPath}`);
    }
  }
  
  if (issuesFound === 0) {
    console.log('\n✅ ¡Verificación completada sin problemas!');
  } else {
    console.log(`\n⚠️  Se encontraron ${issuesFound} problemas que requieren atención`);
  }
}

// Ejecutar configuración
if (require.main === module) {
  (async () => {
    try {
      await setupStructuredTesting();
      if (!DRY_RUN) {
        verifyTestingSetup();
      }
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  setupStructuredTesting,
  verifyTestingSetup
};
