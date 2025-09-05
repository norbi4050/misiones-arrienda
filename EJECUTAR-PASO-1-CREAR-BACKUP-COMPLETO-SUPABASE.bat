@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   PASO 1: CREAR BACKUP COMPLETO
echo   SUPABASE - LIMPIEZA ESQUEMAS 2025
echo ========================================
echo.
echo 🚨 ADVERTENCIA CRÍTICA: Este es el PASO 1 OBLIGATORIO
echo antes de proceder con la limpieza de esquemas duplicados.
echo.
echo ⚠️  IMPORTANTE: Sin este backup NO se puede proceder
echo con los siguientes pasos de forma segura.
echo.
echo 📋 ESTE PASO INCLUYE:
echo ✓ Crear backup completo de todas las tablas
echo ✓ Generar scripts SQL de backup automático
echo ✓ Crear documentación completa del backup
echo ✓ Generar scripts de restauración de emergencia
echo ✓ Verificar integridad del backup creado
echo.

:MENU
echo ========================================
echo           MENÚ PASO 1 - BACKUP
echo ========================================
echo.
echo 1. Ejecutar PASO 1 - Crear backup completo
echo 2. Ver información del backup a crear
echo 3. Verificar variables de entorno requeridas
echo 4. Ver documentación de seguridad
echo 5. Salir (NO recomendado sin backup)
echo.
set /p opcion="Selecciona una opción (1-5): "

if "%opcion%"=="1" goto EJECUTAR_PASO_1
if "%opcion%"=="2" goto VER_INFO
if "%opcion%"=="3" goto VERIFICAR_ENV
if "%opcion%"=="4" goto VER_DOCUMENTACION
if "%opcion%"=="5" goto SALIR_SIN_BACKUP
echo Opción inválida. Intenta de nuevo.
goto MENU

:EJECUTAR_PASO_1
echo.
echo ========================================
echo    EJECUTANDO PASO 1 - BACKUP CRÍTICO
echo ========================================
echo.
echo 🚀 Iniciando creación de backup completo...
echo.
echo IMPORTANTE: Este proceso es CRÍTICO y OBLIGATORIO
echo antes de cualquier operación de limpieza.
echo.
set /p confirmar="¿Continuar con la creación del backup? (S/n): "

if /i "%confirmar%"=="n" goto MENU

echo.
echo ⏳ Ejecutando PASO 1: Crear backup completo...
echo.

REM Verificar que Node.js esté disponible
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Para instalar Node.js:
    echo 1. Ve a https://nodejs.org/
    echo 2. Descarga e instala la versión LTS
    echo 3. Reinicia esta ventana de comandos
    echo.
    pause
    goto MENU
)

REM Ejecutar el PASO 1
node PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ PASO 1 COMPLETADO EXITOSAMENTE
    echo.
    echo 📁 Backup creado correctamente
    echo 📄 Documentación generada
    echo 🔄 Scripts de restauración listos
    echo.
    echo 🎯 PRÓXIMO PASO: Ejecutar verificación de datos únicos
    echo.
    set /p continuar="¿Ver el directorio de backup creado? (S/n): "
    if /i not "%continuar%"=="n" (
        echo.
        echo 📁 Abriendo directorio de backup...
        for /f "tokens=*" %%i in ('dir /b backup-supabase-* 2^>nul') do (
            start "" "%%i"
            goto backup_found
        )
        echo ⚠️  Directorio de backup no encontrado automáticamente
        echo Busca el directorio que comience con "backup-supabase-"
        :backup_found
    )
    echo.
    echo 🔄 SIGUIENTE ACCIÓN RECOMENDADA:
    echo 1. Ejecutar el script SQL de backup en Supabase
    echo 2. Verificar que el backup se creó correctamente
    echo 3. Proceder con PASO 2: Verificación de datos únicos
    echo.
) else (
    echo.
    echo ❌ ERROR durante el PASO 1
    echo.
    echo 🚨 CRÍTICO: Sin backup no se puede proceder
    echo con la limpieza de esquemas duplicados.
    echo.
    echo Revisa los mensajes de error anteriores y
    echo corrige los problemas antes de continuar.
    echo.
)

echo.
pause
goto MENU

:VER_INFO
echo.
echo ========================================
echo      INFORMACIÓN DEL BACKUP A CREAR
echo ========================================
echo.
echo 📋 CONTENIDO DEL BACKUP:
echo.
echo 🗂️  TABLAS PRINCIPALES (PascalCase):
echo    ✓ User - Usuarios del sistema
echo    ✓ Property - Propiedades publicadas
echo    ✓ Agent - Agentes inmobiliarios
echo    ✓ Favorite - Propiedades favoritas
echo    ✓ Conversation - Conversaciones
echo    ✓ Message - Mensajes
echo    ✓ CommunityProfile - Perfiles de comunidad
echo.
echo 🗂️  TABLAS DUPLICADAS (snake_case) - Si existen:
echo    ✓ users - Versión duplicada de User
echo    ✓ properties - Versión duplicada de Property
echo    ✓ agents - Versión duplicada de Agent
echo    ✓ favorites - Versión duplicada de Favorite
echo    ✓ conversations - Versión duplicada de Conversation
echo    ✓ messages - Versión duplicada de Message
echo.
echo 🔐 ELEMENTOS DE SEGURIDAD:
echo    ✓ Políticas RLS (Row Level Security)
echo    ✓ Índices de la base de datos
echo    ✓ Esquemas de backup automático
echo    ✓ Scripts de restauración de emergencia
echo.
echo 📄 ARCHIVOS GENERADOS:
echo    ✓ BACKUP-COMPLETO-SUPABASE.sql
echo    ✓ RESTAURAR-BACKUP-SUPABASE.sql
echo    ✓ DOCUMENTACION-BACKUP.md
echo    ✓ VERIFICACION-BACKUP.sql
echo.
echo 📊 ESTIMACIÓN DE TIEMPO: 2-5 minutos
echo 💾 ESPACIO REQUERIDO: Variable según datos
echo.
pause
goto MENU

:VERIFICAR_ENV
echo.
echo ========================================
echo    VERIFICAR VARIABLES DE ENTORNO
echo ========================================
echo.
echo 🔍 Verificando variables de entorno requeridas...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js: INSTALADO
    for /f "tokens=*" %%i in ('node --version') do echo    Versión: %%i
) else (
    echo ❌ Node.js: NO INSTALADO
    echo    Requerido para ejecutar el script de backup
)

echo.
echo 📋 VARIABLES DE ENTORNO REQUERIDAS:
echo.
echo 🔑 NEXT_PUBLIC_SUPABASE_URL
if defined NEXT_PUBLIC_SUPABASE_URL (
    echo    ✅ CONFIGURADA
    echo    📍 URL: %NEXT_PUBLIC_SUPABASE_URL:~0,30%...
) else (
    echo    ❌ NO CONFIGURADA
    echo    ⚠️  CRÍTICO: Esta variable es obligatoria
)

echo.
echo 🔑 SUPABASE_SERVICE_ROLE_KEY
if defined SUPABASE_SERVICE_ROLE_KEY (
    echo    ✅ CONFIGURADA
    echo    🔐 Key: %SUPABASE_SERVICE_ROLE_KEY:~0,20%...
) else (
    echo    ❌ NO CONFIGURADA
    echo    ⚠️  CRÍTICO: Esta variable es obligatoria
)

echo.
if defined NEXT_PUBLIC_SUPABASE_URL if defined SUPABASE_SERVICE_ROLE_KEY (
    echo ✅ TODAS LAS VARIABLES CONFIGURADAS CORRECTAMENTE
    echo 🚀 Listo para ejecutar el backup
) else (
    echo ❌ FALTAN VARIABLES CRÍTICAS
    echo.
    echo 📋 PARA CONFIGURAR LAS VARIABLES:
    echo 1. Crea un archivo .env.local en el directorio Backend
    echo 2. Agrega las siguientes líneas:
    echo    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    echo    SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
    echo 3. Reinicia esta ventana de comandos
    echo.
    echo 🔗 Obtén estas variables desde tu dashboard de Supabase
)

echo.
pause
goto MENU

:VER_DOCUMENTACION
echo.
echo ========================================
echo       DOCUMENTACIÓN DE SEGURIDAD
echo ========================================
echo.
echo 🛡️  MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
echo.
echo 🔒 BACKUP AUTOMÁTICO:
echo    ✓ Crea esquema de backup con timestamp
echo    ✓ Copia todas las tablas principales
echo    ✓ Preserva estructura y datos
echo    ✓ Incluye políticas RLS e índices
echo.
echo 🔄 RESTAURACIÓN DE EMERGENCIA:
echo    ✓ Script automático de restauración
echo    ✓ Verificaciones de integridad
echo    ✓ Rollback completo en caso de error
echo    ✓ Documentación paso a paso
echo.
echo ⚠️  ADVERTENCIAS CRÍTICAS:
echo    • NO eliminar el directorio de backup
echo    • Mantener copia adicional en ubicación segura
echo    • Probar restauración antes de limpieza
echo    • Ejecutar en horario de bajo tráfico
echo.
echo 🚨 EN CASO DE EMERGENCIA:
echo    1. DETENER inmediatamente la limpieza
echo    2. EJECUTAR script de restauración
echo    3. VERIFICAR integridad de datos
echo    4. CONTACTAR equipo técnico si hay problemas
echo.
echo 📋 PROCESO RECOMENDADO:
echo    1. Crear backup (PASO 1) ← ESTÁS AQUÍ
echo    2. Verificar datos únicos (PASO 2)
echo    3. Ejecutar limpieza (PASO 3)
echo    4. Verificar funcionamiento (PASO 4)
echo    5. Limpiar backups antiguos (PASO 5)
echo.
pause
goto MENU

:SALIR_SIN_BACKUP
echo.
echo ========================================
echo         ADVERTENCIA CRÍTICA
echo ========================================
echo.
echo 🚨 ATENCIÓN: Estás saliendo sin crear el backup
echo.
echo ⚠️  RIESGOS DE NO CREAR BACKUP:
echo    • Pérdida total de datos en caso de error
echo    • Imposibilidad de recuperar información
echo    • Downtime prolongado del sistema
echo    • Pérdida de configuraciones críticas
echo.
echo 🛡️  EL BACKUP ES OBLIGATORIO PORQUE:
echo    • Protege contra errores durante la limpieza
echo    • Permite restauración rápida
echo    • Garantiza continuidad del servicio
echo    • Cumple con mejores prácticas de seguridad
echo.
set /p confirmar_salida="¿Estás SEGURO de salir sin backup? (s/N): "

if /i "%confirmar_salida%"=="s" (
    echo.
    echo ❌ SALIENDO SIN BACKUP - ALTO RIESGO
    echo.
    echo 📋 RECOMENDACIÓN URGENTE:
    echo Ejecuta este script nuevamente y crea el backup
    echo ANTES de proceder con cualquier limpieza.
    echo.
    echo 🔄 Para volver a ejecutar:
    echo Ejecuta: EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Decisión correcta. Regresando al menú...
    echo.
    goto MENU
)

:ERROR
echo.
echo ❌ Error durante la ejecución del PASO 1.
echo.
echo 🔍 POSIBLES CAUSAS:
echo • Variables de entorno no configuradas
echo • Node.js no instalado
echo • Problemas de conexión con Supabase
echo • Permisos insuficientes
echo.
echo 📋 SOLUCIONES:
echo 1. Verificar variables de entorno (opción 3)
echo 2. Instalar Node.js si es necesario
echo 3. Verificar conexión a internet
echo 4. Ejecutar como administrador si es necesario
echo.
pause
exit /b 1
