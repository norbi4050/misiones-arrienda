/**
 * =====================================================
 * PASO 2: VERIFICAR DATOS ÚNICOS EN SUPABASE
 * =====================================================
 * 
 * Este script verifica que no existan datos únicos en las
 * tablas duplicadas antes de proceder con la limpieza.
 * 
 * IMPORTANTE: Solo se ejecuta DESPUÉS del PASO 1 (backup)
 * 
 * Fecha: 2025-01-06
 * Versión: 1.0
 * Estado: PASO 2 - VERIFICACIÓN CRÍTICA
 */

const fs = require('fs');
const path = require('path');

// Configuración de colores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator(title, color = 'cyan') {
    const line = '='.repeat(60);
    log(line, color);
    log(`  ${title}`, color);
    log(line, color);
}

/**
 * PASO 2: VERIFICAR DATOS ÚNICOS
 */
async function verificarDatosUnicos() {
    separator('PASO 2: VERIFICAR DATOS ÚNICOS EN SUPABASE', 'blue');
    
    log('🔍 Iniciando verificación de datos únicos...', 'yellow');
    log('📅 Fecha: ' + new Date().toLocaleString(), 'cyan');
    
    // Verificar que el PASO 1 se haya completado
    const backupExists = await verificarBackupExiste();
    if (!backupExists) {
        log('❌ ERROR CRÍTICO: No se encontró backup del PASO 1', 'red');
        log('', 'reset');
        log('🚨 OBLIGATORIO: Debes ejecutar PASO 1 primero', 'red');
        log('Ejecuta: EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat', 'yellow');
        return false;
    }
    
    log('✅ Backup del PASO 1 encontrado', 'green');
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        log('❌ ERROR CRÍTICO: Variables de entorno de Supabase no configuradas', 'red');
        return false;
    }
    
    log('✅ Variables de entorno configuradas correctamente', 'green');
    
    try {
        // Generar script de verificación
        await generarScriptVerificacion();
        
        // Crear reporte de verificación
        await crearReporteVerificacion();
        
        // Generar guía de interpretación
        await generarGuiaInterpretacion();
        
        log('', 'reset');
        log('✅ PASO 2 COMPLETADO EXITOSAMENTE', 'green');
        log('📋 Scripts de verificación generados', 'cyan');
        log('', 'reset');
        log('🔄 PRÓXIMO PASO: Ejecutar script SQL en Supabase', 'yellow');
        log('📄 Luego revisar el reporte generado', 'yellow');
        
        return true;
        
    } catch (error) {
        log(`❌ ERROR durante la verificación: ${error.message}`, 'red');
        return false;
    }
}

/**
 * VERIFICAR QUE EXISTE BACKUP DEL PASO 1
 */
async function verificarBackupExiste() {
    try {
        const files = fs.readdirSync('.');
        const backupDirs = files.filter(file => 
            file.startsWith('backup-supabase-') && 
            fs.statSync(file).isDirectory()
        );
        
        if (backupDirs.length === 0) {
            return false;
        }
        
        // Verificar que el directorio más reciente tenga los archivos necesarios
        const latestBackup = backupDirs.sort().reverse()[0];
        const requiredFiles = [
            'BACKUP-COMPLETO-SUPABASE.sql',
            'RESTAURAR-BACKUP-SUPABASE.sql',
            'DOCUMENTACION-BACKUP.md'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(latestBackup, file);
            if (!fs.existsSync(filePath)) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * GENERAR SCRIPT DE VERIFICACIÓN SQL
 */
async function generarScriptVerificacion() {
    log('📝 Generando script de verificación SQL...', 'yellow');
    
    const verificacionSQL = `-- =====================================================
-- PASO 2: VERIFICACIÓN DE DATOS ÚNICOS - SUPABASE
-- =====================================================
-- Fecha: ${new Date().toISOString()}
-- Propósito: Verificar datos únicos antes de limpieza
-- CRÍTICO: Ejecutar DESPUÉS del PASO 1 (backup)
-- =====================================================

-- Mensaje de inicio
SELECT 'INICIANDO VERIFICACIÓN DE DATOS ÚNICOS - ${new Date().toISOString()}' as inicio;

-- =====================================================
-- VERIFICAR EXISTENCIA DE TABLAS DUPLICADAS
-- =====================================================

-- Verificar qué tablas duplicadas existen
SELECT 
    'TABLAS DUPLICADAS ENCONTRADAS' as seccion,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages') 
        THEN 'DUPLICADA - CANDIDATA PARA ELIMINACIÓN'
        ELSE 'TABLA PRINCIPAL - MANTENER'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'User', 'users',
        'Property', 'properties', 
        'Agent', 'agents',
        'Favorite', 'favorites',
        'Conversation', 'conversations',
        'Message', 'messages',
        'CommunityProfile'
    )
ORDER BY table_name;

-- =====================================================
-- CONTAR REGISTROS EN TABLAS PRINCIPALES
-- =====================================================

-- Contar registros en tablas principales (PascalCase)
SELECT 'CONTEO TABLAS PRINCIPALES' as seccion;

-- User
SELECT 'User' as tabla, COUNT(*) as registros 
FROM public."User"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public');

-- Property  
SELECT 'Property' as tabla, COUNT(*) as registros 
FROM public."Property"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property' AND table_schema = 'public');

-- Agent
SELECT 'Agent' as tabla, COUNT(*) as registros 
FROM public."Agent"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Agent' AND table_schema = 'public');

-- Favorite
SELECT 'Favorite' as tabla, COUNT(*) as registros 
FROM public."Favorite"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Favorite' AND table_schema = 'public');

-- Conversation
SELECT 'Conversation' as tabla, COUNT(*) as registros 
FROM public."Conversation"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Conversation' AND table_schema = 'public');

-- Message
SELECT 'Message' as tabla, COUNT(*) as registros 
FROM public."Message"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Message' AND table_schema = 'public');

-- CommunityProfile
SELECT 'CommunityProfile' as tabla, COUNT(*) as registros 
FROM public."CommunityProfile"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CommunityProfile' AND table_schema = 'public');

-- =====================================================
-- CONTAR REGISTROS EN TABLAS DUPLICADAS
-- =====================================================

-- Contar registros en tablas duplicadas (snake_case) - SI EXISTEN
SELECT 'CONTEO TABLAS DUPLICADAS' as seccion;

-- users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla users encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.users);
    ELSE
        RAISE NOTICE 'Tabla users NO existe - OK';
    END IF;
END $$;

-- properties (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla properties encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.properties);
    ELSE
        RAISE NOTICE 'Tabla properties NO existe - OK';
    END IF;
END $$;

-- agents (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla agents encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.agents);
    ELSE
        RAISE NOTICE 'Tabla agents NO existe - OK';
    END IF;
END $$;

-- favorites (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla favorites encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.favorites);
    ELSE
        RAISE NOTICE 'Tabla favorites NO existe - OK';
    END IF;
END $$;

-- conversations (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla conversations encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.conversations);
    ELSE
        RAISE NOTICE 'Tabla conversations NO existe - OK';
    END IF;
END $$;

-- messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla messages encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.messages);
    ELSE
        RAISE NOTICE 'Tabla messages NO existe - OK';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR DATOS ÚNICOS EN TABLAS DUPLICADAS
-- =====================================================

-- CRÍTICO: Verificar si hay datos únicos en tablas duplicadas
SELECT 'VERIFICACIÓN DATOS ÚNICOS' as seccion;

-- Verificar users vs User (si users existe)
DO $$
DECLARE
    users_count INTEGER := 0;
    user_count INTEGER := 0;
    unique_in_users INTEGER := 0;
BEGIN
    -- Solo si ambas tablas existen
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') THEN
        
        SELECT COUNT(*) INTO users_count FROM public.users;
        SELECT COUNT(*) INTO user_count FROM public."User";
        
        -- Verificar datos únicos en users que no estén en User
        SELECT COUNT(*) INTO unique_in_users 
        FROM public.users u 
        WHERE NOT EXISTS (
            SELECT 1 FROM public."User" pu 
            WHERE pu.email = u.email OR pu.id = u.id
        );
        
        RAISE NOTICE 'TABLA users: % registros, User: % registros, Únicos en users: %', 
                     users_count, user_count, unique_in_users;
        
        IF unique_in_users > 0 THEN
            RAISE WARNING 'ATENCIÓN: % registros únicos encontrados en tabla users', unique_in_users;
        END IF;
    END IF;
END $$;

-- Verificar properties vs Property (si properties existe)
DO $$
DECLARE
    properties_count INTEGER := 0;
    property_count INTEGER := 0;
    unique_in_properties INTEGER := 0;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Property' AND table_schema = 'public') THEN
        
        SELECT COUNT(*) INTO properties_count FROM public.properties;
        SELECT COUNT(*) INTO property_count FROM public."Property";
        
        -- Verificar datos únicos en properties
        SELECT COUNT(*) INTO unique_in_properties 
        FROM public.properties p 
        WHERE NOT EXISTS (
            SELECT 1 FROM public."Property" pp 
            WHERE pp.title = p.title OR pp.id = p.id
        );
        
        RAISE NOTICE 'TABLA properties: % registros, Property: % registros, Únicos en properties: %', 
                     properties_count, property_count, unique_in_properties;
        
        IF unique_in_properties > 0 THEN
            RAISE WARNING 'ATENCIÓN: % registros únicos encontrados en tabla properties', unique_in_properties;
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFICAR INTEGRIDAD REFERENCIAL
-- =====================================================

-- Verificar foreign keys que podrían verse afectados
SELECT 'VERIFICACIÓN FOREIGN KEYS' as seccion;

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages')
         OR ccu.table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages'));

-- =====================================================
-- VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar políticas RLS en tablas duplicadas
SELECT 'VERIFICACIÓN POLÍTICAS RLS' as seccion;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages')
ORDER BY tablename, policyname;

-- =====================================================
-- RESUMEN DE VERIFICACIÓN
-- =====================================================

SELECT 'RESUMEN DE VERIFICACIÓN COMPLETADO' as seccion;

-- Contar total de tablas duplicadas encontradas
SELECT 
    'RESUMEN FINAL' as tipo,
    COUNT(*) as tablas_duplicadas_encontradas
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages');

-- Mensaje de finalización
SELECT 'VERIFICACIÓN COMPLETADA - ${new Date().toISOString()}' as finalizacion;

-- =====================================================
-- INSTRUCCIONES SIGUIENTES
-- =====================================================

SELECT 'PRÓXIMOS PASOS:' as instrucciones;
SELECT '1. Revisar este reporte cuidadosamente' as paso_1;
SELECT '2. Si hay datos únicos, migrarlos antes de limpieza' as paso_2;
SELECT '3. Si no hay datos únicos, proceder con PASO 3' as paso_3;
SELECT '4. NUNCA proceder sin verificar este reporte' as paso_4;
`;

    fs.writeFileSync('PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql', verificacionSQL);
    log(`✅ Script SQL de verificación generado: PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql`, 'green');
}

/**
 * CREAR REPORTE DE VERIFICACIÓN
 */
async function crearReporteVerificacion() {
    log('📋 Creando plantilla de reporte de verificación...', 'yellow');
    
    const reporteTemplate = `# REPORTE DE VERIFICACIÓN - PASO 2: DATOS ÚNICOS

## 📋 INFORMACIÓN GENERAL

- **Fecha de verificación**: ${new Date().toLocaleString()}
- **Paso**: 2 de 5 - Verificación de datos únicos
- **Estado**: PENDIENTE DE EJECUCIÓN
- **Prerequisito**: PASO 1 (Backup) ✅ COMPLETADO

## 🎯 OBJETIVO

Verificar que no existan datos únicos en las tablas duplicadas (snake_case) antes de proceder con la limpieza. Esto es CRÍTICO para evitar pérdida de datos.

## 📊 RESULTADOS DE VERIFICACIÓN

### Tablas Duplicadas Encontradas:
- [ ] users (snake_case)
- [ ] properties (snake_case)  
- [ ] agents (snake_case)
- [ ] favorites (snake_case)
- [ ] conversations (snake_case)
- [ ] messages (snake_case)

### Conteo de Registros:

#### Tablas Principales (PascalCase):
- User: ___ registros
- Property: ___ registros
- Agent: ___ registros
- Favorite: ___ registros
- Conversation: ___ registros
- Message: ___ registros
- CommunityProfile: ___ registros

#### Tablas Duplicadas (snake_case):
- users: ___ registros
- properties: ___ registros
- agents: ___ registros
- favorites: ___ registros
- conversations: ___ registros
- messages: ___ registros

### Verificación de Datos Únicos:

#### ⚠️ CRÍTICO - Datos únicos encontrados:
- users: ___ registros únicos
- properties: ___ registros únicos
- agents: ___ registros únicos
- favorites: ___ registros únicos
- conversations: ___ registros únicos
- messages: ___ registros únicos

## 🚨 ANÁLISIS DE RIESGO

### ✅ SEGURO PARA LIMPIEZA (0 datos únicos):
- [ ] No se encontraron datos únicos en tablas duplicadas
- [ ] Todas las tablas duplicadas están vacías o contienen datos duplicados
- [ ] Se puede proceder con PASO 3 (Limpieza)

### ⚠️ REQUIERE MIGRACIÓN (datos únicos encontrados):
- [ ] Se encontraron datos únicos en tablas duplicadas
- [ ] OBLIGATORIO: Migrar datos únicos antes de limpieza
- [ ] NO proceder con PASO 3 hasta completar migración

### ❌ ALTO RIESGO (muchos datos únicos):
- [ ] Más de 100 registros únicos encontrados
- [ ] Requiere análisis detallado antes de proceder
- [ ] Considerar migración manual o script personalizado

## 🔍 VERIFICACIONES ADICIONALES

### Foreign Keys Afectados:
- [ ] Verificar dependencias entre tablas
- [ ] Confirmar que foreign keys no se romperán
- [ ] Documentar relaciones críticas

### Políticas RLS:
- [ ] Verificar políticas en tablas duplicadas
- [ ] Confirmar que no hay políticas críticas que se perderán
- [ ] Documentar políticas importantes

## 📋 INSTRUCCIONES PARA COMPLETAR

1. **Ejecutar el script SQL**:
   - Abrir Supabase Dashboard
   - Ir a SQL Editor
   - Ejecutar: \`PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql\`

2. **Completar este reporte**:
   - Llenar los números de registros encontrados
   - Marcar las casillas correspondientes
   - Documentar cualquier hallazgo importante

3. **Tomar decisión**:
   - Si 0 datos únicos: Proceder con PASO 3
   - Si hay datos únicos: Migrar primero
   - Si muchos datos únicos: Análisis detallado

## 🔄 PRÓXIMOS PASOS

### Si NO hay datos únicos:
1. Marcar este reporte como ✅ SEGURO
2. Proceder con PASO 3: Ejecutar limpieza
3. Continuar con el proceso normal

### Si HAY datos únicos:
1. **NO proceder con limpieza**
2. Crear script de migración de datos únicos
3. Ejecutar migración
4. Re-ejecutar este PASO 2
5. Solo proceder cuando sea ✅ SEGURO

## ⚠️ ADVERTENCIAS CRÍTICAS

- **NUNCA** proceder con PASO 3 si hay datos únicos
- **SIEMPRE** completar este reporte antes de continuar
- **VERIFICAR** dos veces los conteos de registros
- **DOCUMENTAR** cualquier anomalía encontrada

## 📞 EN CASO DE DUDAS

Si encuentras resultados inesperados:
1. Detener el proceso inmediatamente
2. Revisar el backup del PASO 1
3. Consultar con el equipo técnico
4. NO proceder hasta tener claridad total

---
*Reporte generado automáticamente por el sistema de limpieza de esquemas duplicados*
*Fecha: ${new Date().toISOString()}*
*Versión: 1.0*
`;

    fs.writeFileSync('REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md', reporteTemplate);
    log(`✅ Plantilla de reporte creada: REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md`, 'green');
}

/**
 * GENERAR GUÍA DE INTERPRETACIÓN
 */
async function generarGuiaInterpretacion() {
    log('📖 Generando guía de interpretación...', 'yellow');
    
    const guia = `# GUÍA DE INTERPRETACIÓN - VERIFICACIÓN DATOS ÚNICOS

## 🎯 CÓMO INTERPRETAR LOS RESULTADOS

### 📊 CONTEOS DE REGISTROS

#### Escenario 1: IDEAL ✅
\`\`\`
User: 150 registros
users: 0 registros (tabla vacía)
\`\`\`
**Interpretación**: Seguro para limpieza. La tabla duplicada está vacía.

#### Escenario 2: DUPLICADOS EXACTOS ✅
\`\`\`
User: 150 registros
users: 150 registros
Únicos en users: 0
\`\`\`
**Interpretación**: Seguro para limpieza. Los datos son duplicados exactos.

#### Escenario 3: DATOS ÚNICOS ⚠️
\`\`\`
User: 150 registros
users: 175 registros
Únicos en users: 25
\`\`\`
**Interpretación**: PELIGRO. Hay 25 registros únicos que se perderían.

#### Escenario 4: SOLO DUPLICADOS ❌
\`\`\`
User: 0 registros (tabla vacía)
users: 150 registros
\`\`\`
**Interpretación**: CRÍTICO. Todos los datos están en la tabla duplicada.

### 🚦 SEMÁFORO DE DECISIONES

#### 🟢 VERDE - PROCEDER
- ✅ 0 datos únicos en todas las tablas duplicadas
- ✅ Tablas duplicadas vacías o con duplicados exactos
- ✅ Foreign keys verificados
- **ACCIÓN**: Proceder con PASO 3

#### 🟡 AMARILLO - PRECAUCIÓN
- ⚠️ 1-10 datos únicos encontrados
- ⚠️ Datos únicos en tablas no críticas
- ⚠️ Foreign keys simples
- **ACCIÓN**: Migrar datos únicos, luego proceder

#### 🔴 ROJO - DETENER
- ❌ Más de 10 datos únicos
- ❌ Datos únicos en tablas críticas (User, Property)
- ❌ Foreign keys complejos
- **ACCIÓN**: Análisis detallado requerido

### 🔍 ANÁLISIS DETALLADO POR TABLA

#### Tabla \`users\` vs \`User\`:
- **Crítica**: SÍ (autenticación y perfiles)
- **Datos únicos aceptables**: 0
- **Acción si hay únicos**: Migración obligatoria

#### Tabla \`properties\` vs \`Property\`:
- **Crítica**: SÍ (propiedades publicadas)
- **Datos únicos aceptables**: 0
- **Acción si hay únicos**: Migración obligatoria

#### Tabla \`agents\` vs \`Agent\`:
- **Crítica**: MEDIA (agentes inmobiliarios)
- **Datos únicos aceptables**: 0-5
- **Acción si hay únicos**: Revisar y migrar

#### Tabla \`favorites\` vs \`Favorite\`:
- **Crítica**: BAJA (favoritos de usuarios)
- **Datos únicos aceptables**: 0-10
- **Acción si hay únicos**: Evaluar migración

#### Tabla \`conversations\` vs \`Conversation\`:
- **Crítica**: MEDIA (conversaciones)
- **Datos únicos aceptables**: 0-5
- **Acción si hay únicos**: Revisar y migrar

#### Tabla \`messages\` vs \`Message\`:
- **Crítica**: MEDIA (mensajes)
- **Datos únicos aceptables**: 0-10
- **Acción si hay únicos**: Evaluar migración

### 🛠️ SCRIPTS DE MIGRACIÓN

#### Para migrar datos únicos de \`users\` a \`User\`:
\`\`\`sql
-- SOLO ejecutar si hay datos únicos confirmados
INSERT INTO public."User" (id, email, name, created_at, updated_at)
SELECT id, email, name, created_at, updated_at
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public."User" pu 
    WHERE pu.email = u.email OR pu.id = u.id
);
\`\`\`

#### Para migrar datos únicos de \`properties\` a \`Property\`:
\`\`\`sql
-- SOLO ejecutar si hay datos únicos confirmados
INSERT INTO public."Property" (id, title, description, price, created_at, updated_at)
SELECT id, title, description, price, created_at, updated_at
FROM public.properties p
WHERE NOT EXISTS (
    SELECT 1 FROM public."Property" pp 
    WHERE pp.title = p.title OR pp.id = p.id
);
\`\`\`

### ⚠️ ADVERTENCIAS IMPORTANTES

1. **NUNCA ejecutar scripts de migración sin verificar primero**
2. **SIEMPRE hacer backup antes de migrar**
3. **VERIFICAR que los datos migrados son correctos**
4. **RE-EJECUTAR verificación después de migrar**

### 🔄 PROCESO COMPLETO DE MIGRACIÓN

1. **Identificar datos únicos** (PASO 2)
2. **Crear script de migración personalizado**
3. **Probar script en backup/desarrollo**
4. **Ejecutar migración en producción**
5. **Re-ejecutar PASO 2 para verificar**
6. **Solo proceder con PASO 3 cuando sea seguro**

### 📞 CONTACTO DE EMERGENCIA

Si encuentras escenarios no cubiertos en esta guía:
- Detener inmediatamente el proceso
- Documentar los hallazgos exactos
- Consultar con el equipo técnico
- NO improvisar soluciones

---
*Guía generada automáticamente*
*Fecha: ${new Date().toISOString()}*
*Versión: 1.0*
`;

    fs.writeFileSync('GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md', guia);
    log(`✅ Guía de interpretación creada: GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md`, 'green');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarDatosUnicos().then(success => {
        if (success) {
            log('', 'reset');
            log('🎯 PASO 2 COMPLETADO EXITOSAMENTE', 'green');
            log('', 'reset');
            log('📋 PRÓXIMOS PASOS:', 'bright');
            log('1. Ejecutar PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql en Supabase', 'cyan');
            log('2. Completar REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md', 'cyan');
            log('3. Revisar GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md', 'cyan');
            log('4. Solo proceder con PASO 3 si es SEGURO', 'cyan');
            log('', 'reset');
            log('⚠️  IMPORTANTE: NO proceder si hay datos únicos', 'yellow');
        } else {
            log('❌ PASO 2 FALLÓ - Revisar errores antes de continuar', 'red');
            process.exit(1);
        }
    }).catch(error => {
        log(`❌ Error fatal en PASO 2: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    verificarDatosUnicos
};
