import logger from '@/lib/simple-logger';

// Extender el tipo Error para incluir captureStackTrace
declare global {
  interface ErrorConstructor {
    captureStackTrace?(targetObject: object, constructorOpt?: Function): void;
  }
}

// Clases de error personalizadas
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

// Función para manejar errores de API
export function handleApiError(error: unknown, request: any) {
  // Logging del error
  logger.error('Error en API:', {
    error: error instanceof Error ? error.message : 'Error desconocido',
    stack: error instanceof Error ? error.stack : undefined,
    url: request.url,
    method: request.method,
    userAgent: request.headers?.['user-agent'],
    ip: request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'],
    timestamp: new Date().toISOString()
  });

  // Errores operacionales (esperados)
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      json: {
        error: error.message,
        code: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Errores de Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseErrors: { [key: string]: { message: string, status: number } } = {
      'PGRST116': { message: 'Recurso no encontrado', status: 404 },
      'PGRST301': { message: 'Error de permisos', status: 403 },
      '23505': { message: 'Dato duplicado', status: 409 },
      '23503': { message: 'Referencia no válida', status: 400 },
      '42501': { message: 'Permiso denegado', status: 403 },
      '42703': { message: 'Columna no existe', status: 400 }
    };

    const errorCode = (error as any).code;
    if (supabaseErrors[errorCode]) {
      return {
        status: supabaseErrors[errorCode].status,
        json: {
          error: supabaseErrors[errorCode].message,
          code: errorCode,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Errores de validación de Zod
  if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'ZodError') {
    const zodError = error as any;
    return {
      status: 400,
      json: {
        error: 'Datos de entrada inválidos',
        details: zodError.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        })) || [],
        timestamp: new Date().toISOString()
      }
    };
  }

  // Errores de autenticación de Supabase
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as any).message;
    if (errorMessage?.includes('JWT') || errorMessage?.includes('auth')) {
      return {
        status: 401,
        json: {
          error: 'Error de autenticación',
          code: 'AUTH_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Errores no operacionales (inesperados)
  return {
    status: 500,
    json: {
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };
}

// Wrapper para handlers con manejo de errores
export function withErrorHandler(handler: Function) {
  return async (request: any, context?: any) => {
    try {
      // Log del request
      logger.info('Request recibido:', {
        method: request.method,
        url: request.url,
        userAgent: request.headers?.['user-agent'],
        ip: request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip']
      });

      const result = await handler(request, context);

      // Log de respuesta exitosa
      logger.info('Response exitosa:', {
        method: request.method,
        url: request.url,
        status: result.status || 200
      });

      return result;
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

// Middleware para validar request body
export function validateRequestBody(schema: any) {
  return (handler: Function) => {
    return async (request: any, context?: any) => {
      try {
        const body = await request.json();

        // Validar con el schema
        const validation = schema.safeParse(body);
        if (!validation.success) {
          throw new ValidationError('Datos de entrada inválidos');
        }

        // Agregar datos validados al request
        (request as any).validatedBody = validation.data;

        return await handler(request, context);
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            status: 400,
            json: {
              error: error.message,
              details: schema.safeParse(await request.json().catch(() => ({}))).error?.errors || [],
              timestamp: new Date().toISOString()
            }
          };
        }
        throw error;
      }
    };
  };
}
