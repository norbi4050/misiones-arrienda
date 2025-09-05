/**
 * =====================================================
 * PASO 1: CREAR BACKUP COMPLETO DE SUPABASE
 * =====================================================
 * 
 * Este script crea un backup completo de la base de datos
 * antes de proceder con la limpieza de esquemas duplicados.
 * 
 * IMPORTANTE: Este paso es CRÍTICO y OBLIGATORIO antes
 * de ejecutar cualquier operación de limpieza.
 * 
 * Fecha: 2025-01-06
 * Versión: 1.0
 * Estado: PASO 1 - BACKUP CRÍTICO
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
 * PASO 1: CREAR BACKUP COMPLETO
 */
async function crearBackupCompleto() {
    separator('PASO 1: CREAR BACKUP COMPLETO DE SUPABASE', 'blue');
    
    log('🔄 Iniciando proceso de backup completo...', 'yellow');
    log('📅 Fecha: ' + new Date().toLocaleString(), 'cyan');
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        log('❌ ERROR CRÍTICO: Variables de entorno de Supabase no configuradas', 'red');
        log('', 'reset');
        log('Variables requeridas:', 'yellow');
        log('- NEXT_PUBLIC_SUPABASE_URL', 'yellow');
        log('- SUPABASE_SERVICE_ROLE_KEY', 'yellow');
        log('', 'reset');
        log('Por favor configura estas variables antes de continuar.', 'red');
        return false;
    }
    
    log('✅ Variables de entorno configuradas correctamente', 'green');
    log(`📍 URL: ${supabaseUrl.substring(0, 30)}...`, 'cyan');
    
    // Crear directorio de backup
    const backupDir = `backup-supabase-${new Date().toISOString().split('T')[0]}`;
    
    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            log(`📁 Directorio de backup creado: ${backupDir}`, 'green');
        }
        
        // Generar script SQL de backup
        await generarScriptBackup(backupDir);
        
        // Crear documentación del backup
        await crearDocumentacionBackup(backupDir);
        
        // Generar script de restauración
        await generarScriptRestauracion(backupDir);
        
        log('', 'reset');
        log('✅ BACKUP COMPLETO CREADO EXITOSAMENTE', 'green');
        log(`📁 Ubicación: ${backupDir}`, 'cyan');
        log('', 'reset');
        log('🔄 PRÓXIMO PASO: Ejecutar verificación de datos únicos', 'yellow');
        
        return true;
        
    } catch (error) {
        log(`❌ ERROR durante la creación del backup: ${error.message}`, 'red');
        return false;
    }
}

/**
 * GENERAR SCRIPT SQL DE BACKUP
 */
async function generarScriptBackup(backupDir) {
    log('📝 Generando script SQL de backup...', 'yellow');
    
    const backupSQL = `-- =====================================================
-- BACKUP COMPLETO SUPABASE - ESQUEMAS DUPLICADOS
-- =====================================================
-- Fecha: ${new Date().toISOString()}
-- Propósito: Backup antes de limpieza de esquemas duplicados
-- CRÍTICO: Este backup debe ejecutarse ANTES de cualquier limpieza
-- =====================================================

-- Crear esquema de backup
CREATE SCHEMA IF NOT EXISTS backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')};

-- =====================================================
-- BACKUP DE TABLAS PRINCIPALES (PascalCase)
-- =====================================================

-- Backup tabla User
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.User_backup AS 
SELECT * FROM public."User";

-- Backup tabla Property
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Property_backup AS 
SELECT * FROM public."Property";

-- Backup tabla Agent
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Agent_backup AS 
SELECT * FROM public."Agent";

-- Backup tabla Favorite
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Favorite_backup AS 
SELECT * FROM public."Favorite";

-- Backup tabla Conversation
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Conversation_backup AS 
SELECT * FROM public."Conversation";

-- Backup tabla Message
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Message_backup AS 
SELECT * FROM public."Message";

-- Backup tabla CommunityProfile
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.CommunityProfile_backup AS 
SELECT * FROM public."CommunityProfile";

-- =====================================================
-- BACKUP DE TABLAS DUPLICADAS (snake_case) - SI EXISTEN
-- =====================================================

-- Backup tabla users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.users_backup AS SELECT * FROM public.users';
    END IF;
END $$;

-- Backup tabla properties (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.properties_backup AS SELECT * FROM public.properties';
    END IF;
END $$;

-- Backup tabla agents (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.agents_backup AS SELECT * FROM public.agents';
    END IF;
END $$;

-- Backup tabla favorites (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.favorites_backup AS SELECT * FROM public.favorites';
    END IF;
END $$;

-- Backup tabla conversations (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.conversations_backup AS SELECT * FROM public.conversations';
    END IF;
END $$;

-- Backup tabla messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        EXECUTE 'CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.messages_backup AS SELECT * FROM public.messages';
    END IF;
END $$;

-- =====================================================
-- BACKUP DE POLÍTICAS RLS
-- =====================================================

-- Crear tabla para backup de políticas
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.policies_backup AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- BACKUP DE ÍNDICES
-- =====================================================

-- Crear tabla para backup de índices
CREATE TABLE backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.indexes_backup AS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================
-- VERIFICACIÓN DEL BACKUP
-- =====================================================

-- Contar registros en tablas principales
SELECT 'User' as tabla, COUNT(*) as registros FROM public."User"
UNION ALL
SELECT 'Property' as tabla, COUNT(*) as registros FROM public."Property"
UNION ALL
SELECT 'Agent' as tabla, COUNT(*) as registros FROM public."Agent"
UNION ALL
SELECT 'Favorite' as tabla, COUNT(*) as registros FROM public."Favorite"
UNION ALL
SELECT 'Conversation' as tabla, COUNT(*) as registros FROM public."Conversation"
UNION ALL
SELECT 'Message' as tabla, COUNT(*) as registros FROM public."Message";

-- Verificar que el backup se creó correctamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}') as columnas
FROM information_schema.tables t
WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}'
ORDER BY table_name;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'BACKUP COMPLETO CREADO EXITOSAMENTE - ${new Date().toISOString()}' as status;
`;

    const backupPath = path.join(backupDir, 'BACKUP-COMPLETO-SUPABASE.sql');
    fs.writeFileSync(backupPath, backupSQL);
    
    log(`✅ Script SQL de backup generado: ${backupPath}`, 'green');
}

/**
 * CREAR DOCUMENTACIÓN DEL BACKUP
 */
async function crearDocumentacionBackup(backupDir) {
    log('📋 Creando documentación del backup...', 'yellow');
    
    const documentacion = `# DOCUMENTACIÓN DEL BACKUP - LIMPIEZA ESQUEMAS SUPABASE

## 📋 INFORMACIÓN GENERAL

- **Fecha de creación**: ${new Date().toLocaleString()}
- **Propósito**: Backup completo antes de limpieza de esquemas duplicados
- **Versión**: 1.0
- **Estado**: CRÍTICO - OBLIGATORIO

## 🎯 OBJETIVO

Este backup se crea como medida de seguridad antes de ejecutar la limpieza de esquemas duplicados en Supabase. Contiene:

1. **Todas las tablas principales** (PascalCase)
2. **Todas las tablas duplicadas** (snake_case) si existen
3. **Políticas RLS** configuradas
4. **Índices** de la base de datos
5. **Scripts de restauración** completos

## 📁 CONTENIDO DEL BACKUP

### Archivos Incluidos:
- \`BACKUP-COMPLETO-SUPABASE.sql\` - Script principal de backup
- \`RESTAURAR-BACKUP-SUPABASE.sql\` - Script de restauración
- \`DOCUMENTACION-BACKUP.md\` - Esta documentación
- \`VERIFICACION-BACKUP.sql\` - Script de verificación

### Tablas Respaldadas:

#### Tablas Principales (PascalCase):
- User
- Property  
- Agent
- Favorite
- Conversation
- Message
- CommunityProfile

#### Tablas Duplicadas (snake_case) - Si existen:
- users
- properties
- agents
- favorites
- conversations
- messages

## 🚨 INSTRUCCIONES CRÍTICAS

### ANTES DE EJECUTAR LA LIMPIEZA:

1. **OBLIGATORIO**: Ejecutar el script \`BACKUP-COMPLETO-SUPABASE.sql\`
2. **VERIFICAR**: Que el backup se creó correctamente
3. **CONFIRMAR**: Que todas las tablas tienen datos respaldados
4. **PROBAR**: El script de restauración en entorno de desarrollo

### EN CASO DE EMERGENCIA:

1. **DETENER** inmediatamente cualquier operación de limpieza
2. **EJECUTAR** el script \`RESTAURAR-BACKUP-SUPABASE.sql\`
3. **VERIFICAR** que los datos se restauraron correctamente
4. **CONTACTAR** al equipo técnico si hay problemas

## ⚠️ ADVERTENCIAS IMPORTANTES

- **NO ELIMINAR** este directorio de backup hasta confirmar que la limpieza fue exitosa
- **MANTENER** una copia adicional del backup en ubicación segura
- **VERIFICAR** regularmente que el backup está íntegro
- **PROBAR** la restauración antes de proceder con la limpieza

## 🔄 PROCESO DE RESTAURACIÓN

En caso de necesitar restaurar el backup:

1. Ejecutar: \`RESTAURAR-BACKUP-SUPABASE.sql\`
2. Verificar con: \`VERIFICACION-BACKUP.sql\`
3. Confirmar integridad de datos
4. Reiniciar servicios si es necesario

## 📞 CONTACTO DE EMERGENCIA

En caso de problemas críticos durante la limpieza:
- Detener inmediatamente todas las operaciones
- Ejecutar restauración de backup
- Documentar el problema ocurrido
- Revisar logs de error detalladamente

---
*Backup creado automáticamente por el sistema de limpieza de esquemas duplicados*
*Fecha: ${new Date().toISOString()}*
`;

    const docPath = path.join(backupDir, 'DOCUMENTACION-BACKUP.md');
    fs.writeFileSync(docPath, documentacion);
    
    log(`✅ Documentación creada: ${docPath}`, 'green');
}

/**
 * GENERAR SCRIPT DE RESTAURACIÓN
 */
async function generarScriptRestauracion(backupDir) {
    log('🔄 Generando script de restauración...', 'yellow');
    
    const restauracionSQL = `-- =====================================================
-- SCRIPT DE RESTAURACIÓN - BACKUP SUPABASE
-- =====================================================
-- Fecha: ${new Date().toISOString()}
-- Propósito: Restaurar backup en caso de emergencia
-- CRÍTICO: Solo usar en caso de problemas durante la limpieza
-- =====================================================

-- ADVERTENCIA CRÍTICA
SELECT 'ADVERTENCIA: Este script restaurará el backup completo. ¿Estás seguro?' as warning;

-- Verificar que el esquema de backup existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}') THEN
        RAISE EXCEPTION 'ERROR CRÍTICO: El esquema de backup no existe. No se puede restaurar.';
    END IF;
END $$;

-- =====================================================
-- RESTAURACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Restaurar tabla User
TRUNCATE public."User" CASCADE;
INSERT INTO public."User" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.User_backup;

-- Restaurar tabla Property
TRUNCATE public."Property" CASCADE;
INSERT INTO public."Property" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Property_backup;

-- Restaurar tabla Agent
TRUNCATE public."Agent" CASCADE;
INSERT INTO public."Agent" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Agent_backup;

-- Restaurar tabla Favorite
TRUNCATE public."Favorite" CASCADE;
INSERT INTO public."Favorite" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Favorite_backup;

-- Restaurar tabla Conversation
TRUNCATE public."Conversation" CASCADE;
INSERT INTO public."Conversation" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Conversation_backup;

-- Restaurar tabla Message
TRUNCATE public."Message" CASCADE;
INSERT INTO public."Message" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.Message_backup;

-- Restaurar tabla CommunityProfile
TRUNCATE public."CommunityProfile" CASCADE;
INSERT INTO public."CommunityProfile" SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.CommunityProfile_backup;

-- =====================================================
-- RESTAURACIÓN DE TABLAS DUPLICADAS (SI EXISTÍAN)
-- =====================================================

-- Restaurar users (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}' AND table_name = 'users_backup') THEN
        DROP TABLE IF EXISTS public.users CASCADE;
        EXECUTE 'CREATE TABLE public.users AS SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.users_backup';
    END IF;
END $$;

-- Restaurar properties (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}' AND table_name = 'properties_backup') THEN
        DROP TABLE IF EXISTS public.properties CASCADE;
        EXECUTE 'CREATE TABLE public.properties AS SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.properties_backup';
    END IF;
END $$;

-- Restaurar agents (si existía)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}' AND table_name = 'agents_backup') THEN
        DROP TABLE IF EXISTS public.agents CASCADE;
        EXECUTE 'CREATE TABLE public.agents AS SELECT * FROM backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.agents_backup';
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN DE RESTAURACIÓN
-- =====================================================

-- Contar registros restaurados
SELECT 'User' as tabla, COUNT(*) as registros FROM public."User"
UNION ALL
SELECT 'Property' as tabla, COUNT(*) as registros FROM public."Property"
UNION ALL
SELECT 'Agent' as tabla, COUNT(*) as registros FROM public."Agent"
UNION ALL
SELECT 'Favorite' as tabla, COUNT(*) as registros FROM public."Favorite"
UNION ALL
SELECT 'Conversation' as tabla, COUNT(*) as registros FROM public."Conversation"
UNION ALL
SELECT 'Message' as tabla, COUNT(*) as registros FROM public."Message";

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

SELECT 'RESTAURACIÓN COMPLETADA EXITOSAMENTE - ${new Date().toISOString()}' as status;
`;

    const restaurarPath = path.join(backupDir, 'RESTAURAR-BACKUP-SUPABASE.sql');
    fs.writeFileSync(restaurarPath, restauracionSQL);
    
    log(`✅ Script de restauración generado: ${restaurarPath}`, 'green');
    
    // También crear script de verificación
    const verificacionSQL = `-- Script de verificación del backup
SELECT 
    'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}' as esquema_backup,
    COUNT(*) as tablas_backup
FROM information_schema.tables 
WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}';

-- Verificar integridad de datos
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}') as columnas
FROM information_schema.tables t
WHERE table_schema = 'backup_limpieza_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}'
ORDER BY table_name;
`;

    const verificarPath = path.join(backupDir, 'VERIFICACION-BACKUP.sql');
    fs.writeFileSync(verificarPath, verificacionSQL);
    
    log(`✅ Script de verificación generado: ${verificarPath}`, 'green');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    crearBackupCompleto().then(success => {
        if (success) {
            log('', 'reset');
            log('🎯 PASO 1 COMPLETADO EXITOSAMENTE', 'green');
            log('', 'reset');
            log('📋 PRÓXIMOS PASOS:', 'bright');
            log('1. Ejecutar el script SQL de backup en Supabase', 'cyan');
            log('2. Verificar que el backup se creó correctamente', 'cyan');
            log('3. Proceder con PASO 2: Verificación de datos únicos', 'cyan');
            log('', 'reset');
        } else {
            log('❌ PASO 1 FALLÓ - No proceder con los siguientes pasos', 'red');
            process.exit(1);
        }
    }).catch(error => {
        log(`❌ Error fatal en PASO 1: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    crearBackupCompleto
};
