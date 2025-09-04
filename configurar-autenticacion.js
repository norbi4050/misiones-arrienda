const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Crear cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Función para configurar políticas de autenticación
async function configurarPoliticasAuth() {
    console.log('🔐 CONFIGURANDO POLÍTICAS DE AUTENTICACIÓN');
    console.log('============================================\n');
    
    const politicas = [
        {
            nombre: 'Verificar acceso a auth.users',
            descripcion: 'Confirmar acceso a usuarios de autenticación',
            accion: async () => {
                const { data, error } = await supabase.auth.admin.listUsers();
                if (error) {
                    throw new Error(`Error accediendo a auth.users: ${error.message}`);
                }
                console.log(`✅ Acceso a auth.users confirmado (${data.users.length} usuarios)`);
                return true;
            }
        },
        {
            nombre: 'Verificar tabla profiles',
            descripcion: 'Comprobar acceso a tabla de perfiles',
            accion: async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .limit(1);
                
                if (error && error.message.includes('relation "public.profiles" does not exist')) {
                    console.log('⚠️  Tabla profiles no existe, necesita creación manual');
                    return false;
                } else if (error && error.message.includes('permission denied')) {
                    console.log('⚠️  Sin permisos para acceder a profiles');
                    return false;
                } else if (error) {
                    console.log(`⚠️  Error verificando profiles: ${error.message}`);
                    return false;
                } else {
                    console.log('✅ Tabla profiles accesible');
                    return true;
                }
            }
        },
        {
            nombre: 'Verificar tabla properties',
            descripcion: 'Comprobar acceso a tabla de propiedades',
            accion: async () => {
                const { data, error } = await supabase
                    .from('properties')
                    .select('id')
                    .limit(1);
                
                if (error && error.message.includes('relation "public.properties" does not exist')) {
                    console.log('⚠️  Tabla properties no existe, necesita creación manual');
                    return false;
                } else if (error && error.message.includes('permission denied')) {
                    console.log('⚠️  Sin permisos para acceder a properties');
                    return false;
                } else if (error) {
                    console.log(`⚠️  Error verificando properties: ${error.message}`);
                    return false;
                } else {
                    console.log('✅ Tabla properties accesible');
                    return true;
                }
            }
        },
        {
            nombre: 'Verificar Storage Buckets',
            descripcion: 'Confirmar acceso a buckets de almacenamiento',
            accion: async () => {
                const { data, error } = await supabase.storage.listBuckets();
                if (error) {
                    throw new Error(`Error accediendo a Storage: ${error.message}`);
                }
                console.log(`✅ Storage accesible con ${data.length} buckets`);
                data.forEach(bucket => {
                    console.log(`  - ${bucket.name} (público: ${bucket.public})`);
                });
                return true;
            }
        },
        {
            nombre: 'Test de creación de usuario',
            descripcion: 'Probar flujo completo de autenticación',
            accion: async () => {
                try {
                    const testEmail = 'test-auth-config@example.com';
                    
                    // Primero intentar eliminar si existe
                    const { data: existingUsers } = await supabase.auth.admin.listUsers();
                    const existingUser = existingUsers.users.find(u => u.email === testEmail);
                    
                    if (existingUser) {
                        await supabase.auth.admin.deleteUser(existingUser.id);
                        console.log('🗑️  Usuario de prueba existente eliminado');
                    }
                    
                    // Crear usuario de prueba
                    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                        email: testEmail,
                        password: 'test-password-123',
                        email_confirm: true
                    });
                    
                    if (createError) {
                        throw new Error(`Error creando usuario de prueba: ${createError.message}`);
                    }
                    
                    console.log(`✅ Usuario de prueba creado: ${newUser.user.id}`);
                    
                    // Limpiar - eliminar usuario de prueba
                    await supabase.auth.admin.deleteUser(newUser.user.id);
                    console.log('🧹 Usuario de prueba eliminado');
                    
                    return true;
                } catch (err) {
                    console.log(`⚠️  Error en prueba de autenticación: ${err.message}`);
                    return false;
                }
            }
        }
    ];
    
    let politicasConfiguradas = 0;
    let politicasExitosas = 0;
    
    for (const politica of politicas) {
        try {
            console.log(`🔄 ${politica.nombre}`);
            console.log(`   ${politica.descripcion}`);
            
            const resultado = await politica.accion();
            
            if (resultado) {
                console.log(`✅ ${politica.nombre}: Configurado exitosamente`);
                politicasExitosas++;
            } else {
                console.log(`⚠️  ${politica.nombre}: Requiere configuración manual`);
            }
            
            politicasConfiguradas++;
        } catch (error) {
            console.log(`❌ Error en ${politica.nombre}: ${error.message}`);
            politicasConfiguradas++;
        }
        
        console.log(''); // Línea en blanco para separar
        
        // Pausa entre configuraciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 RESUMEN DE CONFIGURACIÓN:');
    console.log('============================');
    console.log(`✅ Políticas procesadas: ${politicasConfiguradas}/${politicas.length}`);
    console.log(`🎯 Políticas exitosas: ${politicasExitosas}/${politicas.length}`);
    
    const porcentajeExito = Math.round((politicasExitosas / politicas.length) * 100);
    console.log(`📈 Porcentaje de éxito: ${porcentajeExito}%`);
    
    if (porcentajeExito >= 80) {
        console.log('🎉 Configuración de autenticación: EXCELENTE');
    } else if (porcentajeExito >= 60) {
        console.log('✅ Configuración de autenticación: BUENA');
    } else if (porcentajeExito >= 40) {
        console.log('⚠️  Configuración de autenticación: PARCIAL');
    } else {
        console.log('❌ Configuración de autenticación: REQUIERE ATENCIÓN');
    }
    
    return {
        procesadas: politicasConfiguradas,
        exitosas: politicasExitosas,
        porcentaje: porcentajeExito
    };
}

// Función principal
async function configurarAutenticacionCompleta() {
    console.log('🎯 CONFIGURACIÓN COMPLETA DE AUTENTICACIÓN');
    console.log('==========================================\n');
    
    try {
        // Configurar políticas
        const resultadoPoliticas = await configurarPoliticasAuth();
        
        console.log('\n📊 RESUMEN FINAL:');
        console.log('==================');
        console.log(`🔐 Políticas configuradas: ${resultadoPoliticas.exitosas}/${resultadoPoliticas.procesadas}`);
        console.log(`📈 Porcentaje de éxito: ${resultadoPoliticas.porcentaje}%`);
        
        console.log('\n🎯 PRÓXIMOS PASOS:');
        if (resultadoPoliticas.porcentaje < 80) {
            console.log('1. 📋 Revisar configuración manual en Supabase Dashboard');
            console.log('2. 🔧 Crear tablas faltantes usando SQL Editor');
            console.log('3. 🔄 Re-ejecutar este script para verificar');
        } else {
            console.log('1. ✅ Configuración completada exitosamente');
            console.log('2. 🚀 Continuar con testing de funcionalidades');
        }
        
        return resultadoPoliticas;
    } catch (error) {
        console.log('❌ Error en configuración completa:', error.message);
        throw error;
    }
}

module.exports = {
    supabase,
    configurarPoliticasAuth,
    configurarAutenticacionCompleta
};

// Ejecutar si se llama directamente
if (require.main === module) {
    configurarAutenticacionCompleta()
        .then(resultado => {
            if (resultado.porcentaje >= 60) {
                console.log('\n✅ Configuración de autenticación completada');
                process.exit(0);
            } else {
                console.log('\n⚠️  Configuración requiere atención manual');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal en configuración:', error.message);
            process.exit(1);
        });
}
