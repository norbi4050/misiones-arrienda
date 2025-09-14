/**
 * 📁 SCRIPT DE REORGANIZACIÓN DE ESTRUCTURA DEL PROYECTO
 * 
 * Este script reorganiza la estructura de archivos del proyecto según los estándares
 * establecidos en la Fase 3, creando una estructura limpia y mantenible.
 */

const fs = require('fs');
const path = require('path');

// Configuración de reorganización
const PROJECT_ROOT = path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// Nueva estructura objetivo
const TARGET_STRUCTURE = {
  'src/types': 'Definiciones TypeScript',
  'src/utils': 'Utilidades compartidas',
  'src/components/ui': 'Componentes reutilizables',
  'src/components/forms': 'Formularios específicos',
  'src/components/layout': 'Componentes de layout',
  'src/lib/config': 'Configuraciones centralizadas',
  'scripts/migration': 'Scripts de migración',
  'scripts/testing': 'Scripts de testing',
  'scripts/maintenance': 'Scripts de mantenimiento',
  'sql-migrations/core': 'Migraciones principales',
  'sql-migrations/data': 'Datos de prueba',
  'sql-migrations/fixes': 'Correcciones específicas',
  'docs/api': 'Documentación de APIs',
  'docs/components': 'Documentación de componentes',
  'docs/deployment': 'Guías de despliegue',
  'docs/development': 'Guías de desarrollo'
};

// Mapeo de archivos a mover
const FILE_MAPPINGS = [
  // Tipos TypeScript
  {
    from: 'src/lib/types.ts',
    to: 'src/types/index.ts',
    create: true
  },
  
  // Utilidades
  {
    from: 'src/lib/utils.ts',
    to: 'src/utils/index.ts',
    create: true
  },
  
  // Componentes de formularios
  {
    pattern: 'src/components/ui/*form*.tsx',
    to: 'src/components/forms/'
  },
  
  // Scripts de testing
  {
    pattern: 'test-*.js',
    to: 'scripts/testing/'
  },
  {
    pattern: 'verify-*.js',
    to: 'scripts/testing/'
  },
  
  // Scripts de migración
  {
    pattern: 'scripts/migrate-*.js',
    to: 'scripts/migration/'
  },
  {
    pattern: 'scripts/cleanup-*.js',
    to: 'scripts/maintenance/'
  },
  
  // Migraciones SQL por categoría
  {
    pattern: 'sql-migrations/create-*.sql',
    to: 'sql-migrations/core/'
  },
  {
    pattern: 'sql-migrations/CREAR-DATOS-*.sql',
    to: 'sql-migrations/data/'
  },
  {
    pattern: 'sql-migrations/FIX-*.sql',
    to: 'sql-migrations/fixes/'
  },
  {
    pattern: 'sql-migrations/fix-*.sql',
    to: 'sql-migrations/fixes/'
  }
];

// Archivos de configuración a crear
const CONFIG_FILES = [
  {
    path: 'src/lib/config/index.ts',
    content: `/**
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
    throw new Error(\`Variable de entorno requerida faltante: \${envVar}\`);
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
`
  },
  
  {
    path: 'src/types/index.ts',
    content: `/**
 * 📝 DEFINICIONES DE TIPOS TYPESCRIPT
 */

// Tipos de usuario
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';
export type UserType = 'inquilino' | 'dueno_directo' | 'inmobiliaria';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  user_type?: UserType;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de propiedad
export type PropertyStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'EXPIRED';
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'ROOM' | 'STUDIO' | 'COMMERCIAL' | 'OTHER';

export interface Property {
  id: string;
  title: string;
  description?: string;
  type?: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  images?: string[];
  featured: boolean;
  userId: string;
  created_at: string;
  updated_at: string;
}

// Tipos de API
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  name: string;
  user_type: UserType;
}

export interface PropertyForm {
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  currency: string;
  images: File[];
}

// Tipos de configuración
export interface Config {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  features: {
    enableAnalytics: boolean;
    enablePayments: boolean;
    enableTesting: boolean;
    enableDebugLogs: boolean;
  };
}

// Tipos de hooks
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Tipos de eventos
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

// Exportar todos los tipos
export type * from './api';
export type * from './components';
export type * from './database';
`
  },
  
  {
    path: 'src/utils/index.ts',
    content: `/**
 * 🛠️ UTILIDADES COMPARTIDAS
 */

// Utilidades de formato
export const formatCurrency = (amount: number, currency = 'ARS'): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return \`hace \${Math.floor(diffInSeconds / 60)} minutos\`;
  if (diffInSeconds < 86400) return \`hace \${Math.floor(diffInSeconds / 3600)} horas\`;
  return \`hace \${Math.floor(diffInSeconds / 86400)} días\`;
};

// Utilidades de validación
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Utilidades de texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Utilidades de arrays
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Utilidades de objetos
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Utilidades de archivos
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Utilidades de desarrollo
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(\`[INFO] \${message}\`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(\`[WARN] \${message}\`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(\`[ERROR] \${message}\`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.ENABLE_DEBUG_LOGS === 'true') {
      console.debug(\`[DEBUG] \${message}\`, ...args);
    }
  },
};

// Utilidades de performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Exportar todas las utilidades
export * from './api';
export * from './storage';
export * from './validation';
`
  }
];

// Contadores para estadísticas
let stats = {
  directoriesCreated: 0,
  filesMoved: 0,
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
 * Mueve un archivo de una ubicación a otra
 */
function moveFile(fromPath, toPath) {
  try {
    const fullFromPath = path.join(PROJECT_ROOT, fromPath);
    const fullToPath = path.join(PROJECT_ROOT, toPath);
    
    if (!fs.existsSync(fullFromPath)) {
      console.log(`⏭️  Archivo no existe: ${fromPath}`);
      return false;
    }
    
    // Crear directorio destino si no existe
    const toDir = path.dirname(fullToPath);
    ensureDirectory(toDir);
    
    if (DRY_RUN) {
      console.log(`📄 [DRY RUN] Movería: ${fromPath} → ${toPath}`);
    } else {
      fs.renameSync(fullFromPath, fullToPath);
      console.log(`📄 Archivo movido: ${fromPath} → ${toPath}`);
    }
    
    stats.filesMoved++;
    return true;
  } catch (error) {
    console.error(`❌ Error moviendo ${fromPath} → ${toPath}:`, error.message);
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
 * Busca archivos que coincidan con un patrón
 */
function findFilesByPattern(pattern) {
  const glob = require('glob');
  try {
    return glob.sync(pattern, { cwd: PROJECT_ROOT });
  } catch (error) {
    console.error(`❌ Error buscando archivos con patrón ${pattern}:`, error.message);
    return [];
  }
}

/**
 * Actualiza las importaciones en un archivo
 */
function updateImports(filePath, importMappings) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(`from ['"]${oldImport}['"]`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, `from "${newImport}"`);
        updated = true;
      }
    }
    
    if (updated) {
      if (DRY_RUN) {
        console.log(`🔄 [DRY RUN] Actualizaría imports en: ${filePath}`);
      } else {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`🔄 Imports actualizados en: ${filePath}`);
      }
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Error actualizando imports en ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Función principal de reorganización
 */
async function reorganizeProject() {
  console.log('📁 Iniciando reorganización de estructura del proyecto...\n');
  
  if (DRY_RUN) {
    console.log('🔍 MODO DRY RUN - Solo se mostrarán los cambios\n');
  }
  
  // 1. Crear estructura de directorios objetivo
  console.log('📁 Creando estructura de directorios...');
  for (const [dirPath, description] of Object.entries(TARGET_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    ensureDirectory(fullPath);
  }
  
  // 2. Crear archivos de configuración
  console.log('\n📝 Creando archivos de configuración...');
  for (const configFile of CONFIG_FILES) {
    createFile(configFile.path, configFile.content);
  }
  
  // 3. Mover archivos según mapeo
  console.log('\n📄 Moviendo archivos...');
  for (const mapping of FILE_MAPPINGS) {
    if (mapping.pattern) {
      // Buscar archivos por patrón
      const files = findFilesByPattern(mapping.pattern);
      for (const file of files) {
        const fileName = path.basename(file);
        const toPath = path.join(mapping.to, fileName);
        moveFile(file, toPath);
      }
    } else if (mapping.from && mapping.to) {
      // Mover archivo específico
      if (mapping.create && !fs.existsSync(path.join(PROJECT_ROOT, mapping.from))) {
        // Crear archivo si no existe
        createFile(mapping.to, '// TODO: Implementar contenido\nexport {};\n');
      } else {
        moveFile(mapping.from, mapping.to);
      }
    }
  }
  
  // 4. Actualizar importaciones
  console.log('\n🔄 Actualizando importaciones...');
  const importMappings = {
    '../lib/types': '../types',
    '../lib/utils': '../utils',
    '@/lib/types': '@/types',
    '@/lib/utils': '@/utils',
    '../lib/config': '../lib/config',
    '@/lib/config': '@/lib/config',
  };
  
  // Buscar archivos TypeScript y JavaScript para actualizar
  const codeFiles = [
    ...findFilesByPattern('src/**/*.ts'),
    ...findFilesByPattern('src/**/*.tsx'),
    ...findFilesByPattern('src/**/*.js'),
    ...findFilesByPattern('src/**/*.jsx'),
  ];
  
  for (const file of codeFiles) {
    updateImports(file, importMappings);
  }
  
  // 5. Crear archivos de documentación
  console.log('\n📚 Creando documentación...');
  const docFiles = [
    {
      path: 'docs/README.md',
      content: '# Documentación del Proyecto\n\nEsta carpeta contiene toda la documentación técnica del proyecto.\n'
    },
    {
      path: 'docs/api/README.md',
      content: '# Documentación de APIs\n\nDocumentación de todas las APIs del proyecto.\n'
    },
    {
      path: 'docs/components/README.md',
      content: '# Documentación de Componentes\n\nDocumentación de todos los componentes React.\n'
    },
    {
      path: 'docs/deployment/README.md',
      content: '# Guías de Despliegue\n\nInstrucciones para desplegar el proyecto en diferentes entornos.\n'
    }
  ];
  
  for (const docFile of docFiles) {
    createFile(docFile.path, docFile.content);
  }
  
  // Estadísticas finales
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE REORGANIZACIÓN');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📁 Directorios creados: ${stats.directoriesCreated}`);
  console.log(`📄 Archivos movidos: ${stats.filesMoved}`);
  console.log(`📝 Archivos creados: ${stats.filesCreated}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para ejecutar los cambios realmente, ejecuta sin --dry-run');
  } else if (stats.errors === 0) {
    console.log('\n🎉 ¡Reorganización completada exitosamente!');
    console.log('💡 Recuerda probar que todo funciona correctamente después de los cambios');
  } else {
    console.log(`\n⚠️  Reorganización completada con ${stats.errors} errores`);
  }
}

/**
 * Función de verificación post-reorganización
 */
function verifyReorganization() {
  console.log('\n🔍 Verificando reorganización...');
  
  let issuesFound = 0;
  
  // Verificar que los directorios objetivo existen
  for (const dirPath of Object.keys(TARGET_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Directorio faltante: ${dirPath}`);
      issuesFound++;
    } else {
      console.log(`✅ Directorio presente: ${dirPath}`);
    }
  }
  
  // Verificar archivos de configuración críticos
  const criticalFiles = [
    'src/lib/config/index.ts',
    'src/types/index.ts',
    'src/utils/index.ts'
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
  
  if (issuesFound === 0) {
    console.log('\n✅ ¡Verificación completada sin problemas!');
  } else {
    console.log(`\n⚠️  Se encontraron ${issuesFound} problemas que requieren atención`);
  }
}

// Ejecutar reorganización
if (require.main === module) {
  (async () => {
    try {
      await reorganizeProject();
      if (!DRY_RUN) {
        verifyReorganization();
      }
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  reorganizeProject,
  verifyReorganization
};
