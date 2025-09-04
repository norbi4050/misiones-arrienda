
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con service role para operaciones administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para verificar conexión con fallback
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('Advertencia de conexión DB:', error.message);
      return { connected: false, error: error.message };
    }
    
    return { connected: true, data };
  } catch (error) {
    console.error('Error crítico de conexión:', error);
    return { connected: false, error: (error as Error).message };
  }
}

// Función para ejecutar queries con retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Intento ${i + 1} falló:, lastError.message`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

// Función para obtener datos con fallback a mock
export async function getDataWithFallback<T>(
  operation: () => Promise<T>,
  fallbackData: T,
  context: string = 'operación'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`Usando datos de fallback para ${context}:, (error as Error).message`);
    return fallbackData;
  }
}
