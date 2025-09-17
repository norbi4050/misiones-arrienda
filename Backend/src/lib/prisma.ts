import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración mejorada de Prisma con mejor manejo de errores
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Función para verificar la conexión de la base de datos
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    return false;
  }
}

// Función para desconectar de la base de datos de forma segura
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
}

// Función para manejar errores de Prisma de forma más específica
export function handlePrismaError(error: any) {
  console.error('Error de Prisma:', error);

  if (error.code === 'P2002') {
    return {
      message: 'Ya existe un registro con esos datos únicos',
      field: error.meta?.target?.[0] || 'campo único'
    };
  }

  if (error.code === 'P2025') {
    return {
      message: 'Registro no encontrado',
      field: null
    };
  }

  if (error.code === 'P1001') {
    return {
      message: 'No se puede conectar a la base de datos',
      field: null
    };
  }

  return {
    message: 'Error interno de la base de datos',
    field: null
  };
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
