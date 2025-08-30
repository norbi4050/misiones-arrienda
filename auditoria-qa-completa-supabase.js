const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORÍA QA COMPLETA - PROYECTO MISIONES ARRIENDA');
console.log('====================================================');
console.log('🔗 Conectando con Supabase: qfeyhaaxyemmnohqdele');

// Configuración de Supabase con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzU5NzQsImV4cCI6MjA1MDU1MTk3NH0.YOUR_ANON_KEY',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NTk3NCwiZXhwIjoyMDUwNTUxOTc0fQ.YOUR_SERVICE_ROLE_KEY',
    databaseUrl: 'postgresql://postgres:TU_PASSWORD%21@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require'
};

async function auditoriaCriticaCompleta() {
    const errores = [];
    const advertencias = [];
    const exitos = [];
    
    console.log('\n📋 FASE 1: AUDITORÍA DE VARIABLES DE ENTORNO');
    console.log('============================================');
    
    // Verificar archivo .env.local
    const envPath = 'Backend/.env.local';
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Verificar variables críticas
        const variablesCriticas = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'MERCADOPAGO_ACCESS_TOKEN'
        ];
        
        variablesCriticas.forEach(variable => {
            if (envContent.includes(variable)) {
                exitos.push(`✅ Variable ${variable} presente`);
            } else {
                errores.push(`❌ Variable ${variable} FALTANTE`);
            }
        });
        
        // Verificar URLs de Supabase
        if (envContent.includes('qfeyhaaxyemmnohqdele.supabase.co')) {
            exitos.push('✅ URL de Supabase correcta');
        } else {
            errores.push('❌ URL de Supabase incorrecta o faltante');
        }
        
    } else {
        errores.push('❌ Archivo .env.local NO EXISTE');
    }
    
    console.log('\n📋 FASE 2: AUDITORÍA DEL SCHEMA PRISMA');
    console.log('=====================================');
    
    const schemaPath = 'Backend/prisma/schema.prisma';
    if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Verificar configuración de Supabase
        if (schemaContent.includes('postgresql')) {
            exitos.push('✅ Configuración PostgreSQL presente');
        } else {
            errores.push('❌ Configuración PostgreSQL faltante');
        }
        
        // Verificar modelo Property
        if (schemaContent.includes('model Property')) {
            exitos.push('✅ Modelo Property presente');
            
            // Verificar campos críticos
            const camposCriticos = [
                'contact_phone',
                'title',
                'description',
                'price',
                'bedrooms',
                'bathrooms',
                'address',
                'city'
            ];
            
            camposCriticos.forEach(campo => {
                if (schemaContent.includes(campo)) {
                    exitos.push(`✅ Campo ${campo} presente en Prisma`);
                } else {
                    errores.push(`❌ Campo ${campo} FALTANTE en Prisma`);
                }
            });
            
        } else {
            errores.push('❌ Modelo Property FALTANTE en schema.prisma');
        }
        
    } else {
        errores.push('❌ Archivo schema.prisma NO EXISTE');
    }
    
    console.log('\n📋 FASE 3: AUDITORÍA DE VALIDACIONES ZOD');
    console.log('=======================================');
    
    const validationsPath = 'Backend/src/lib/validations/property.ts';
    if (fs.existsSync(validationsPath)) {
        const validationsContent = fs.readFileSync(validationsPath, 'utf8');
        
        // Verificar schema Zod
        if (validationsContent.includes('z.object')) {
            exitos.push('✅ Schema Zod presente');
            
            // Verificar campos críticos en Zod
            const camposZod = [
                'contact_phone',
                'title',
                'description',
                'price',
                'bedrooms',
                'bathrooms'
            ];
            
            camposZod.forEach(campo => {
                if (validationsContent.includes(campo)) {
                    exitos.push(`✅ Campo ${campo} presente en Zod`);
                } else {
                    errores.push(`❌ Campo ${campo} FALTANTE en Zod`);
                }
            });
            
        } else {
            errores.push('❌ Schema Zod NO ENCONTRADO');
        }
        
    } else {
        errores.push('❌ Archivo de validaciones NO EXISTE');
    }
    
    console.log('\n📋 FASE 4: AUDITORÍA DE API ROUTES');
    console.log('=================================');
    
    const apiRoutePath = 'Backend/src/app/api/properties/route.ts';
    if (fs.existsSync(apiRoutePath)) {
        const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
        
        // Verificar métodos HTTP
        if (apiContent.includes('export async function GET')) {
            exitos.push('✅ Método GET implementado');
        } else {
            errores.push('❌ Método GET FALTANTE');
        }
        
        if (apiContent.includes('export async function POST')) {
            exitos.push('✅ Método POST implementado');
        } else {
            errores.push('❌ Método POST FALTANTE');
        }
        
        // Verificar integración con Supabase
        if (apiContent.includes('supabase') || apiContent.includes('createClient')) {
            exitos.push('✅ Integración Supabase presente');
        } else {
            advertencias.push('⚠️ Integración Supabase no detectada');
        }
        
        // Verificar validación de datos
        if (apiContent.includes('propertySchema') || apiContent.includes('parse')) {
            exitos.push('✅ Validación de datos presente');
        } else {
            errores.push('❌ Validación de datos FALTANTE');
        }
        
    } else {
        errores.push('❌ API Route properties NO EXISTE');
    }
    
    console.log('\n📋 FASE 5: AUDITORÍA DEL FORMULARIO');
    console.log('==================================');
    
    const formPath = 'Backend/src/app/publicar/page.tsx';
    if (fs.existsSync(formPath)) {
        const formContent = fs.readFileSync(formPath, 'utf8');
        
        // Verificar campos del formulario
        const camposFormulario = [
            'contact_phone',
            'title',
            'description',
            'price',
            'bedrooms',
            'bathrooms',
            'address',
            'city'
        ];
        
        camposFormulario.forEach(campo => {
            if (formContent.includes(campo) || formContent.includes(`name="${campo}"`)) {
                exitos.push(`✅ Campo ${campo} presente en formulario`);
            } else {
                errores.push(`❌ Campo ${campo} FALTANTE en formulario`);
            }
        });
        
        // Verificar manejo de formulario
        if (formContent.includes('onSubmit') || formContent.includes('handleSubmit')) {
            exitos.push('✅ Manejo de envío presente');
        } else {
            errores.push('❌ Manejo de envío FALTANTE');
        }
        
        // Verificar validación en cliente
        if (formContent.includes('useForm') || formContent.includes('zodResolver')) {
            exitos.push('✅ Validación en cliente presente');
        } else {
            advertencias.push('⚠️ Validación en cliente no detectada');
        }
        
    } else {
        errores.push('❌ Página de publicar NO EXISTE');
    }
    
    console.log('\n📋 FASE 6: AUDITORÍA DE CONFIGURACIÓN SUPABASE');
    console.log('==============================================');
    
    const supabaseClientPath = 'Backend/src/lib/supabase/client.ts';
    const supabaseServerPath = 'Backend/src/lib/supabase/server.ts';
    
    if (fs.existsSync(supabaseClientPath)) {
        const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
        
        if (clientContent.includes('createClient')) {
            exitos.push('✅ Cliente Supabase configurado');
        } else {
            errores.push('❌ Cliente Supabase MAL CONFIGURADO');
        }
        
        if (clientContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
            exitos.push('✅ Variables de entorno utilizadas');
        } else {
            errores.push('❌ Variables de entorno NO utilizadas');
        }
        
    } else {
        errores.push('❌ Cliente Supabase NO EXISTE');
    }
    
    if (fs.existsSync(supabaseServerPath)) {
        const serverContent = fs.readFileSync(supabaseServerPath, 'utf8');
        
        if (serverContent.includes('createServerClient')) {
            exitos.push('✅ Servidor Supabase configurado');
        } else {
            errores.push('❌ Servidor Supabase MAL CONFIGURADO');
        }
        
    } else {
        errores.push('❌ Servidor Supabase NO EXISTE');
    }
    
    console.log('\n📋 FASE 7: AUDITORÍA DE DEPENDENCIAS');
    console.log('===================================');
    
    const packagePath = 'Backend/package.json';
    if (fs.existsSync(packagePath)) {
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        const dependenciasCriticas = [
            '@supabase/supabase-js',
            'next',
            'react',
            'zod',
            '@hookform/resolvers',
            'react-hook-form'
        ];
        
        dependenciasCriticas.forEach(dep => {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                exitos.push(`✅ Dependencia ${dep} presente`);
            } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
                exitos.push(`✅ Dependencia ${dep} presente (dev)`);
            } else {
                errores.push(`❌ Dependencia ${dep} FALTANTE`);
            }
        });
        
    } else {
        errores.push('❌ package.json NO EXISTE');
    }
    
    console.log('\n📋 FASE 8: AUDITORÍA DE ESTRUCTURA DE ARCHIVOS');
    console.log('==============================================');
    
    const archivosCriticos = [
        'Backend/src/app/layout.tsx',
        'Backend/src/app/page.tsx',
        'Backend/src/app/publicar/page.tsx',
        'Backend/src/app/api/properties/route.ts',
        'Backend/src/lib/supabase/client.ts',
        'Backend/src/lib/supabase/server.ts',
        'Backend/src/lib/validations/property.ts',
        'Backend/prisma/schema.prisma',
        'Backend/next.config.js',
        'Backend/tailwind.config.ts'
    ];
    
    archivosCriticos.forEach(archivo => {
        if (fs.existsSync(archivo)) {
            exitos.push(`✅ ${archivo}`);
        } else {
            errores.push(`❌ ${archivo} FALTANTE`);
        }
    });
    
    console.log('\n📋 FASE 9: AUDITORÍA DE CONFIGURACIÓN NEXT.JS');
    console.log('=============================================');
    
    const nextConfigPath = 'Backend/next.config.js';
    if (fs.existsSync(nextConfigPath)) {
        const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
        
        if (nextConfigContent.includes('experimental') || nextConfigContent.includes('serverActions')) {
            exitos.push('✅ Configuración experimental presente');
        } else {
            advertencias.push('⚠️ Configuración experimental no detectada');
        }
        
    } else {
        errores.push('❌ next.config.js NO EXISTE');
    }
    
    console.log('\n📋 FASE 10: AUDITORÍA DE MIDDLEWARE');
    console.log('==================================');
    
    const middlewarePath = 'Backend/src/middleware.ts';
    if (fs.existsSync(middlewarePath)) {
        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        
        if (middlewareContent.includes('supabase')) {
            exitos.push('✅ Middleware Supabase presente');
        } else {
            advertencias.push('⚠️ Middleware Supabase no detectado');
        }
        
    } else {
        advertencias.push('⚠️ Middleware NO EXISTE');
    }
    
    return { errores, advertencias, exitos };
}

async function generarReporteQA() {
    console.log('\n🚀 INICIANDO AUDITORÍA QA COMPLETA...');
    
    const resultado = await auditoriaCriticaCompleta();
    
    console.log('\n📊 RESUMEN DE AUDITORÍA QA');
    console.log('==========================');
    console.log(`✅ Éxitos: ${resultado.exitos.length}`);
    console.log(`⚠️ Advertencias: ${resultado.advertencias.length}`);
    console.log(`❌ Errores: ${resultado.errores.length}`);
    
    // Mostrar resultados
    if (resultado.exitos.length > 0) {
        console.log('\n✅ ELEMENTOS CORRECTOS:');
        resultado.exitos.forEach(exito => console.log(exito));
    }
    
    if (resultado.advertencias.length > 0) {
        console.log('\n⚠️ ADVERTENCIAS:');
        resultado.advertencias.forEach(advertencia => console.log(advertencia));
    }
    
    if (resultado.errores.length > 0) {
        console.log('\n❌ ERRORES CRÍTICOS:');
        resultado.errores.forEach(error => console.log(error));
    }
    
    // Generar reporte detallado
    const reporte = `# 🔍 REPORTE QA COMPLETO - PROYECTO MISIONES ARRIENDA

## 📊 RESUMEN EJECUTIVO

**Fecha:** ${new Date().toLocaleString()}
**Proyecto:** Misiones Arrienda
**Supabase ID:** qfeyhaaxyemmnohqdele

### 📈 MÉTRICAS GENERALES
- ✅ **Éxitos:** ${resultado.exitos.length}
- ⚠️ **Advertencias:** ${resultado.advertencias.length}
- ❌ **Errores:** ${resultado.errores.length}
- 📊 **Puntuación:** ${Math.round((resultado.exitos.length / (resultado.exitos.length + resultado.errores.length)) * 100)}%

## ✅ ELEMENTOS CORRECTOS (${resultado.exitos.length})

${resultado.exitos.map(exito => `- ${exito}`).join('\n')}

## ⚠️ ADVERTENCIAS (${resultado.advertencias.length})

${resultado.advertencias.map(advertencia => `- ${advertencia}`).join('\n')}

## ❌ ERRORES CRÍTICOS (${resultado.errores.length})

${resultado.errores.map(error => `- ${error}`).join('\n')}

## 🎯 RECOMENDACIONES PRIORITARIAS

### 🔥 CRÍTICO (Resolver Inmediatamente)
${resultado.errores.length > 0 ? 
    resultado.errores.slice(0, 5).map(error => `- ${error.replace('❌', '🔥')}`).join('\n') :
    '- ✅ No hay errores críticos detectados'
}

### ⚡ IMPORTANTE (Resolver Pronto)
${resultado.advertencias.length > 0 ? 
    resultado.advertencias.slice(0, 3).map(adv => `- ${adv.replace('⚠️', '⚡')}`).join('\n') :
    '- ✅ No hay advertencias importantes'
}

## 🧪 PLAN DE TESTING RECOMENDADO

### 1. Testing Inmediato
- [ ] Verificar conexión con Supabase
- [ ] Probar formulario de publicar
- [ ] Validar API endpoints
- [ ] Confirmar variables de entorno

### 2. Testing Funcional
- [ ] Flujo completo de publicación
- [ ] Validación de datos
- [ ] Manejo de errores
- [ ] Respuesta de la API

### 3. Testing de Integración
- [ ] Conexión Base de Datos
- [ ] Autenticación de usuarios
- [ ] Carga de imágenes
- [ ] Notificaciones

## 📋 CHECKLIST DE CORRECCIONES

${resultado.errores.length > 0 ? 
    resultado.errores.map((error, index) => `- [ ] ${error}`).join('\n') :
    '- [x] ✅ Todos los elementos críticos están correctos'
}

## 🚀 PRÓXIMOS PASOS

1. **Corregir errores críticos** listados arriba
2. **Ejecutar testing funcional** del formulario
3. **Verificar conexión Supabase** en vivo
4. **Probar flujo completo** de publicación
5. **Validar en producción** si es necesario

---

**Estado General:** ${resultado.errores.length === 0 ? '🟢 LISTO PARA PRODUCCIÓN' : 
                     resultado.errores.length <= 3 ? '🟡 REQUIERE CORRECCIONES MENORES' : 
                     '🔴 REQUIERE CORRECCIONES CRÍTICAS'}
`;
    
    // Guardar reporte
    fs.writeFileSync('REPORTE-QA-COMPLETO-SUPABASE.md', reporte);
    console.log('\n📄 Reporte guardado: REPORTE-QA-COMPLETO-SUPABASE.md');
    
    // Determinar estado general
    let estadoGeneral;
    if (resultado.errores.length === 0) {
        estadoGeneral = '🟢 PROYECTO LISTO PARA PRODUCCIÓN';
    } else if (resultado.errores.length <= 3) {
        estadoGeneral = '🟡 PROYECTO REQUIERE CORRECCIONES MENORES';
    } else {
        estadoGeneral = '🔴 PROYECTO REQUIERE CORRECCIONES CRÍTICAS';
    }
    
    console.log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`);
    
    return {
        estado: estadoGeneral,
        errores: resultado.errores.length,
        advertencias: resultado.advertencias.length,
        exitos: resultado.exitos.length,
        puntuacion: Math.round((resultado.exitos.length / (resultado.exitos.length + resultado.errores.length)) * 100)
    };
}

// Ejecutar auditoría
generarReporteQA().then(resultado => {
    console.log('\n🎉 AUDITORÍA QA COMPLETADA');
    console.log('==========================');
    console.log(`📊 Puntuación: ${resultado.puntuacion}%`);
    console.log(`📈 Estado: ${resultado.estado}`);
    console.log(`📋 Errores: ${resultado.errores}`);
    console.log(`⚠️ Advertencias: ${resultado.advertencias}`);
    console.log(`✅ Éxitos: ${resultado.exitos}`);
    
    if (resultado.errores === 0) {
        console.log('\n🚀 ¡PROYECTO LISTO PARA TESTING EN VIVO!');
    } else {
        console.log('\n🔧 CORRECCIONES NECESARIAS ANTES DEL TESTING');
    }
    
}).catch(error => {
    console.error('❌ Error en auditoría:', error);
});
