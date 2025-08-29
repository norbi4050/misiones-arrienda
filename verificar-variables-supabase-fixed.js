// Script para verificar variables de entorno de Supabase de forma segura
const fs = require('fs');
const path = require('path');

function verificarVariablesSupabase() {
    console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO SUPABASE');
    console.log('==============================================\n');
    
    const envPath = path.join(__dirname, 'Backend', '.env.local');
    
    try {
        // Verificar si existe el archivo .env.local
        if (!fs.existsSync(envPath)) {
            console.log('❌ No se encontró el archivo .env.local');
            return false;
        }
        
        // Leer el archivo .env.local
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        console.log('📋 Variables encontradas en .env.local:');
        console.log('=====================================');
        
        const requiredVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];
        
        const foundVars = {};
        
        envLines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const cleanKey = key.trim();
                const cleanValue = value.trim();
                
                if (requiredVars.includes(cleanKey)) {
                    foundVars[cleanKey] = cleanValue;
                    console.log(`✅ ${cleanKey}: ${cleanValue.substring(0, 20)}...`);
                }
            }
        });
        
        console.log('\n🔍 VERIFICACIÓN DE VARIABLES REQUERIDAS:');
        console.log('=======================================');
        
        let allFound = true;
        requiredVars.forEach(varName => {
            if (foundVars[varName]) {
                console.log(`✅ ${varName}: Configurada`);
            } else {
                console.log(`❌ ${varName}: NO ENCONTRADA`);
                allFound = false;
            }
        });
        
        if (allFound) {
            console.log('\n✅ TODAS LAS VARIABLES ESTÁN CONFIGURADAS CORRECTAMENTE');
            
            // Verificar formato de URL
            const supabaseUrl = foundVars['NEXT_PUBLIC_SUPABASE_URL'];
            if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
                console.log('✅ URL de Supabase tiene formato válido');
            } else {
                console.log('⚠️ Verificar formato de URL de Supabase');
            }
            
            // Verificar longitud de claves
            const anonKey = foundVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
            const serviceKey = foundVars['SUPABASE_SERVICE_ROLE_KEY'];
            
            if (anonKey && anonKey.length > 100) {
                console.log('✅ Clave anónima tiene longitud válida');
            } else {
                console.log('⚠️ Verificar clave anónima de Supabase');
            }
            
            if (serviceKey && serviceKey.length > 100) {
                console.log('✅ Clave de servicio tiene longitud válida');
            } else {
                console.log('⚠️ Verificar clave de servicio de Supabase');
            }
            
        } else {
            console.log('\n❌ FALTAN VARIABLES DE ENTORNO CRÍTICAS');
        }
        
        return allFound;
        
    } catch (error) {
        console.error('❌ Error verificando variables:', error.message);
        return false;
    }
}

// Función para crear un archivo de configuración del cliente
function crearConfiguracionCliente() {
    console.log('\n🔧 CREANDO CONFIGURACIÓN SEGURA DEL CLIENTE');
    console.log('===========================================');
    
    const clientConfigPath = path.join(__dirname, 'Backend', 'src', 'lib', 'supabase-config.ts');
    
    const clientConfig = `// Configuración segura de Supabase para el cliente
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

// Verificación de configuración
export function verificarConfiguracion() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error('Variables de entorno de Supabase no configuradas');
  }
  
  if (!supabaseConfig.url.includes('supabase.co')) {
    throw new Error('URL de Supabase inválida');
  }
  
  return true;
}

// Función para uso en componentes
export function getSupabaseConfig() {
  try {
    verificarConfiguracion();
    return supabaseConfig;
  } catch (error) {
    console.error('Error de configuración Supabase:', error);
    return null;
  }
}
`;
    
    try {
        // Crear directorio si no existe
        const libDir = path.dirname(clientConfigPath);
        if (!fs.existsSync(libDir)) {
            fs.mkdirSync(libDir, { recursive: true });
        }
        
        fs.writeFileSync(clientConfigPath, clientConfig);
        console.log('✅ Archivo de configuración creado: src/lib/supabase-config.ts');
        
        return true;
    } catch (error) {
        console.error('❌ Error creando configuración:', error.message);
        return false;
    }
}

// Ejecutar verificación
if (require.main === module) {
    const variablesOk = verificarVariablesSupabase();
    
    if (variablesOk) {
        crearConfiguracionCliente();
        console.log('\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    } else {
        console.log('\n❌ VERIFICACIÓN FALLÓ - REVISAR CONFIGURACIÓN');
    }
}

module.exports = { verificarVariablesSupabase, crearConfiguracionCliente };
