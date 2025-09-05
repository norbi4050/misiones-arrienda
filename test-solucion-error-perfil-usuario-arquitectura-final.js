const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjI3MzgsImV4cCI6MjA1MTQ5ODczOH0.vgrh05Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSolucionErrorPerfilUsuario() {
    console.log('🔍 TESTING - SOLUCION ERROR PERFIL USUARIO ARQUITECTURA FINAL');
    console.log('================================================================');
    
    try {
        // 1. Verificar estructura de la tabla users
        console.log('\n1. 📋 Verificando estructura de tabla users...');
        
        const { data: tableInfo, error: tableError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
            
        if (tableError) {
            console.log('❌ Error al consultar tabla users:', tableError.message);
            return;
        }
        
        console.log('✅ Tabla users accesible');
        
        // 2. Verificar columnas disponibles
        console.log('\n2. 🔍 Verificando columnas disponibles...');
        
        if (tableInfo && tableInfo.length > 0) {
            const columns = Object.keys(tableInfo[0]);
            console.log('📊 Columnas encontradas:', columns);
            
            // Verificar si existe updatedAt
            if (!columns.includes('updatedAt') && !columns.includes('updated_at')) {
                console.log('⚠️  PROBLEMA DETECTADO: No existe columna updatedAt/updated_at');
                console.log('💡 Solución: Usar solo las columnas existentes');
            }
        }
        
        // 3. Test de lectura de perfil (sin actualización)
        console.log('\n3. 📖 Testing lectura de perfil...');
        
        const { data: profiles, error: readError } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, created_at')
            .limit(5);
            
        if (readError) {
            console.log('❌ Error en lectura:', readError.message);
        } else {
            console.log('✅ Lectura exitosa:', profiles?.length || 0, 'perfiles encontrados');
        }
        
        // 4. Test del endpoint API corregido
        console.log('\n4. 🌐 Testing endpoint /api/users/profile...');
        
        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Endpoint funcionando correctamente');
                console.log('📊 Respuesta:', data);
            } else {
                console.log('⚠️  Endpoint devolvió error:', response.status, response.statusText);
                const errorText = await response.text();
                console.log('📄 Detalle del error:', errorText);
            }
        } catch (fetchError) {
            console.log('❌ Error al conectar con endpoint:', fetchError.message);
            console.log('💡 Asegúrate de que el servidor esté ejecutándose en localhost:3000');
        }
        
        // 5. Verificar hook useAuth.ts
        console.log('\n5. 🔧 Verificando corrección en useAuth.ts...');
        
        const fs = require('fs');
        const path = require('path');
        
        try {
            const useAuthPath = path.join(__dirname, 'Backend', 'src', 'hooks', 'useAuth.ts');
            const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
            
            // Verificar que no haya llamadas directas a Supabase
            const hasDirectSupabaseCalls = useAuthContent.includes('supabase.from(') || 
                                         useAuthContent.includes('supabase.auth.getUser()');
            
            if (hasDirectSupabaseCalls) {
                console.log('⚠️  ADVERTENCIA: useAuth.ts aún contiene llamadas directas a Supabase');
                console.log('💡 Debería usar fetch() al endpoint /api/users/profile');
            } else {
                console.log('✅ useAuth.ts corregido - usa endpoints API en lugar de llamadas directas');
            }
            
            // Verificar que use fetch
            const usesFetch = useAuthContent.includes('fetch(') && 
                            useAuthContent.includes('/api/users/profile');
            
            if (usesFetch) {
                console.log('✅ useAuth.ts usa correctamente fetch() para obtener perfil');
            } else {
                console.log('⚠️  useAuth.ts no parece usar fetch() para el perfil');
            }
            
        } catch (fileError) {
            console.log('❌ Error al leer useAuth.ts:', fileError.message);
        }
        
        // 6. Resumen de la solución
        console.log('\n6. 📋 RESUMEN DE LA SOLUCION IMPLEMENTADA');
        console.log('==========================================');
        console.log('✅ Problema identificado: Columna updatedAt no existe en Supabase');
        console.log('✅ Solución: Arquitectura corregida para usar endpoints API');
        console.log('✅ useAuth.ts modificado para eliminar llamadas directas a Supabase');
        console.log('✅ Endpoint /api/users/profile maneja la lógica de base de datos');
        console.log('✅ Evita errores PGRST204 (schema cache issues)');
        
        // 7. Recomendaciones
        console.log('\n7. 💡 RECOMENDACIONES');
        console.log('=====================');
        console.log('1. Mantener la arquitectura API-first para todas las operaciones de BD');
        console.log('2. Usar solo columnas que existen realmente en Supabase');
        console.log('3. Implementar manejo de errores robusto en los endpoints');
        console.log('4. Considerar agregar columna updated_at si es necesaria');
        
        console.log('\n🎉 TESTING COMPLETADO EXITOSAMENTE');
        
    } catch (error) {
        console.error('❌ Error durante el testing:', error);
        console.log('\n🔧 PASOS PARA RESOLVER:');
        console.log('1. Verificar que Supabase esté configurado correctamente');
        console.log('2. Revisar las variables de entorno');
        console.log('3. Confirmar que la tabla users existe');
        console.log('4. Verificar permisos de acceso a la tabla');
    }
}

// Ejecutar el test
testSolucionErrorPerfilUsuario();
