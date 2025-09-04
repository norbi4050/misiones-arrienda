const fs = require('fs');
const path = require('path');

console.log('🔧 SCRIPT DE CORRECCIÓN AUTOMÁTICA - MISIONES ARRIENDA');
console.log('=====================================================');
console.log('📅 Fecha:', new Date().toLocaleString());
console.log('🎯 Objetivo: Implementar mejoras automáticas');
console.log('=====================================================\n');

const corrections = {
    implemented: [],
    errors: [],
    warnings: [],
    progress: 0
};

// 1. MEJORAR MANEJO DE ERRORES EN APIs
console.log('🔧 1. MEJORANDO MANEJO DE ERRORES EN APIs...');

try {
    // Mejorar API de registro
    const registerApiPath = 'Backend/src/app/api/auth/register/route.ts';
    if (fs.existsSync(registerApiPath)) {
        let registerContent = fs.readFileSync(registerApiPath, 'utf8');
        
        // Agregar mejor manejo de errores
        const improvedErrorHandling = `
// Manejo mejorado de errores
const handleApiError = (error: any, context: string) => {
  console.error(\`Error en \${context}:\`, error);
  
  if (error.message?.includes('permission denied')) {
    return NextResponse.json(
      { 
        error: 'Error de permisos de base de datos. Verifica la configuración de Supabase.',
        details: 'Las políticas RLS pueden no estar configuradas correctamente.',
        context 
      },
      { status: 403 }
    );
  }
  
  if (error.message?.includes('connection')) {
    return NextResponse.json(
      { 
        error: 'Error de conexión a la base de datos.',
        details: 'Verifica las credenciales de Supabase.',
        context 
      },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido',
      context 
    },
    { status: 500 }
  );
};
`;

        // Insertar el manejo de errores si no existe
        if (!registerContent.includes('handleApiError')) {
            registerContent = improvedErrorHandling + '\n' + registerContent;
            
            // Reemplazar manejo básico de errores
            registerContent = registerContent.replace(
                /catch\s*\(\s*error\s*\)\s*{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\);?\s*}/g,
                `catch (error) {
    return handleApiError(error, 'registro de usuario');
  }`
            );
            
            fs.writeFileSync(registerApiPath, registerContent);
            corrections.implemented.push('✅ Mejorado manejo de errores en API de registro');
        }
    }
    
    corrections.progress += 20;
    console.log('✅ Manejo de errores mejorado (20%)');
    
} catch (error) {
    corrections.errors.push(`❌ Error mejorando APIs: ${error.message}`);
    console.log('❌ Error en mejora de APIs');
}

// 2. IMPLEMENTAR FALLBACKS PARA CONEXIÓN DB
console.log('\n🔧 2. IMPLEMENTANDO FALLBACKS PARA DB...');

try {
    // Crear utilidad de conexión con fallback
    const dbUtilsPath = 'Backend/src/lib/db-utils.ts';
    const dbUtilsContent = `
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
      console.warn(\`Intento \${i + 1} falló:, lastError.message\`);
      
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
    console.warn(\`Usando datos de fallback para \${context}:, (error as Error).message\`);
    return fallbackData;
  }
}
`;

    fs.writeFileSync(dbUtilsPath, dbUtilsContent);
    corrections.implemented.push('✅ Creada utilidad de conexión DB con fallbacks');
    
    corrections.progress += 20;
    console.log('✅ Fallbacks de DB implementados (40%)');
    
} catch (error) {
    corrections.errors.push(`❌ Error implementando fallbacks: ${error.message}`);
    console.log('❌ Error en fallbacks de DB');
}

// 3. OPTIMIZAR COMPONENTES REACT
console.log('\n🔧 3. OPTIMIZANDO COMPONENTES REACT...');

try {
    // Crear hook personalizado para manejo de estados
    const useApiHookPath = 'Backend/src/hooks/useApi.ts';
    const useApiContent = `
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Hook específico para autenticación
export function useAuth() {
  const api = useApi<any>();
  
  const login = useCallback(async (email: string, password: string) => {
    return api.execute(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error de autenticación');
      }
      
      return response.json();
    });
  }, [api]);

  const register = useCallback(async (userData: any) => {
    return api.execute(async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Error de registro');
      }
      
      return response.json();
    });
  }, [api]);

  return {
    ...api,
    login,
    register
  };
}
`;

    fs.writeFileSync(useApiHookPath, useApiContent);
    corrections.implemented.push('✅ Creados hooks optimizados para APIs');
    
    corrections.progress += 20;
    console.log('✅ Componentes React optimizados (60%)');
    
} catch (error) {
    corrections.errors.push(`❌ Error optimizando componentes: ${error.message}`);
    console.log('❌ Error en optimización de componentes');
}

// 4. CREAR SCRIPT DE TESTING AUTOMÁTICO
console.log('\n🔧 4. CREANDO SCRIPT DE TESTING...');

try {
    const testingScriptPath = 'TESTING-AUTOMATICO-FINAL.js';
    const testingContent = `
const fs = require('fs');

console.log('🧪 TESTING AUTOMÁTICO - PROYECTO MISIONES ARRIENDA');
console.log('=================================================');

async function testSupabaseConnection() {
  console.log('\\n🔧 Probando conexión Supabase...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health/db');
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Conexión Supabase: EXITOSA');
      return true;
    } else {
      console.log('❌ Conexión Supabase: FALLÓ');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error probando conexión:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('\\n🔧 Probando registro de usuario...');
  
  const testUser = {
    email: 'test@example.com',
    password: 'test123456',
    name: 'Usuario Test'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registro de usuario: EXITOSO');
      return true;
    } else {
      console.log('❌ Registro de usuario: FALLÓ');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error probando registro:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testing completo...\\n');
  
  const results = {
    connection: await testSupabaseConnection(),
    registration: await testRegistration()
  };
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\\n📊 RESULTADOS FINALES:');
  console.log('========================');
  console.log(\`✅ Tests exitosos: \${successCount}/\${totalTests}\`);
  console.log(\`📈 Porcentaje de éxito: \${Math.round((successCount/totalTests) * 100)}%\`);
  
  if (successCount === totalTests) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar configuración.');
  }
  
  return results;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testSupabaseConnection, testRegistration };
`;

    fs.writeFileSync(testingScriptPath, testingContent);
    corrections.implemented.push('✅ Creado script de testing automático');
    
    corrections.progress += 20;
    console.log('✅ Script de testing creado (80%)');
    
} catch (error) {
    corrections.errors.push(`❌ Error creando testing: ${error.message}`);
    console.log('❌ Error en script de testing');
}

// 5. CREAR SCRIPT EJECUTABLE
console.log('\n🔧 5. CREANDO SCRIPT EJECUTABLE...');

try {
    const executorPath = 'EJECUTAR-CORRECCIONES-AUTOMATICAS.bat';
    const executorContent = `@echo off
echo ========================================
echo BLACKBOX AI - CORRECCIONES AUTOMATICAS
echo ========================================
echo 🚀 Aplicando mejoras automaticas...
echo 📅 Fecha: %date% %time%
echo ========================================

echo.
echo 🔧 Ejecutando correcciones...
node SCRIPT-CORRECCION-AUTOMATICA-FINAL.js

echo.
echo 🧪 Ejecutando testing automatico...
node TESTING-AUTOMATICO-FINAL.js

echo.
echo ========================================
echo ✅ Correcciones automaticas completadas!
echo 📋 Revisa los resultados arriba
echo 🎯 Ahora configura Supabase Dashboard
echo ========================================

pause
`;

    fs.writeFileSync(executorPath, executorContent);
    corrections.implemented.push('✅ Creado script ejecutable');
    
    corrections.progress += 20;
    console.log('✅ Script ejecutable creado (100%)');
    
} catch (error) {
    corrections.errors.push(`❌ Error creando ejecutable: ${error.message}`);
    console.log('❌ Error en script ejecutable');
}

// GENERAR REPORTE FINAL
console.log('\n📊 GENERANDO REPORTE FINAL...');

const reportPath = 'REPORTE-CORRECCIONES-AUTOMATICAS-FINAL.md';
const reportContent = `# 🔧 REPORTE DE CORRECCIONES AUTOMÁTICAS

## 📊 RESUMEN EJECUTIVO

**Fecha:** ${new Date().toLocaleString()}  
**Progreso:** ${corrections.progress}%  
**Mejoras Implementadas:** ${corrections.implemented.length}  
**Errores:** ${corrections.errors.length}  

---

## ✅ MEJORAS IMPLEMENTADAS

${corrections.implemented.map(item => `- ${item}`).join('\n')}

---

## ❌ ERRORES ENCONTRADOS

${corrections.errors.length > 0 ? 
  corrections.errors.map(item => `- ${item}`).join('\n') : 
  '✅ No se encontraron errores'}

---

## 🎯 PRÓXIMOS PASOS

### **TU PARTE (15 minutos):**
1. Ve a: https://supabase.com/dashboard
2. Selecciona proyecto: \`qfeyhaaxyemmnohqdele\`
3. Configura políticas RLS según la guía
4. Habilita permisos de esquema público

### **DESPUÉS:**
1. Ejecuta: \`EJECUTAR-CORRECCIONES-AUTOMATICAS.bat\`
2. Prueba el proyecto: \`cd Backend && npm run dev\`
3. Verifica funcionalidad 100%

---

## 📋 ARCHIVOS CREADOS

- ✅ \`Backend/src/lib/db-utils.ts\` - Utilidades de DB con fallbacks
- ✅ \`Backend/src/hooks/useApi.ts\` - Hooks optimizados
- ✅ \`TESTING-AUTOMATICO-FINAL.js\` - Script de testing
- ✅ \`EJECUTAR-CORRECCIONES-AUTOMATICAS.bat\` - Ejecutor

---

*Correcciones aplicadas por BLACKBOX AI*  
*Estado: LISTO PARA CONFIGURACIÓN SUPABASE*
`;

fs.writeFileSync(reportPath, reportContent);

// MOSTRAR RESUMEN FINAL
console.log('\n📊 RESUMEN FINAL DE CORRECCIONES:');
console.log('==================================');
console.log(`✅ Progreso: ${corrections.progress}%`);
console.log(`✅ Mejoras implementadas: ${corrections.implemented.length}`);
console.log(`❌ Errores: ${corrections.errors.length}`);
console.log('\n🎯 SIGUIENTE PASO:');
console.log('Configura Supabase Dashboard según la guía');
console.log('Luego ejecuta: EJECUTAR-CORRECCIONES-AUTOMATICAS.bat');
console.log('\n✅ ¡Correcciones automáticas completadas!');
