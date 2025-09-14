/**
 * 🔧 CONFIGURACIÓN CENTRALIZADA DEL PROYECTO
 */

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable de entorno requerida faltante: ${envVar}`);
  }
}

// Configuración de Supabase
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
} as const;

// Configuración de la aplicación
export const appConfig = {
  name: 'Misiones Arrienda',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Configuración de características
export const featureFlags = {
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enablePayments: process.env.ENABLE_PAYMENTS === 'true',
  enableTesting: process.env.ENABLE_TESTING === 'true',
  enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
} as const;

// URLs de API
export const apiEndpoints = {
  users: '/api/users',
  properties: '/api/properties',
  admin: '/api/admin',
  auth: '/api/auth',
} as const;

// Configuración de Storage
export const storageConfig = {
  buckets: {
    properties: 'properties',
    avatars: 'avatars',
    documents: 'documents',
  },
  maxFileSizes: {
    image: 10 * 1024 * 1024, // 10MB
    avatar: 2 * 1024 * 1024,  // 2MB
    document: 50 * 1024 * 1024, // 50MB
  },
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    avatars: ['image/jpeg', 'image/png', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
} as const;

// Configuración por defecto
export const config = {
  supabase: supabaseConfig,
  app: appConfig,
  features: featureFlags,
  api: apiEndpoints,
  storage: storageConfig,
} as const;

export default config;
