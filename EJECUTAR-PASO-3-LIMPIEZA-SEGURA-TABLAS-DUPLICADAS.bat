@echo off
echo ============================================================
echo   EJECUTAR PASO 3: LIMPIEZA SEGURA DE TABLAS DUPLICADAS
echo ============================================================
echo.
echo 🧹 Iniciando limpieza segura de esquemas duplicados...
echo 📅 Fecha: %date% %time%
echo.

REM Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    echo 📋 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente
echo.

REM Verificar que existan las variables de entorno
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ❌ Error: Variable NEXT_PUBLIC_SUPABASE_URL no configurada
    echo 📋 Configura las variables de entorno de Supabase
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Error: Variable SUPABASE_SERVICE_ROLE_KEY no configurada
    echo 📋 Configura las variables de entorno de Supabase
    pause
    exit /b 1
)

echo ✅ Variables de entorno configuradas
echo.

REM Verificar que existan los backups del PASO 1
if not exist "BACKUP-SUPABASE-PASO-1-COMPLETO.sql" (
    echo ❌ Error: Backup del PASO 1 no encontrado
    echo 📋 Ejecuta primero el PASO 1 para crear backups
    pause
    exit /b 1
)

echo ✅ Backups del PASO 1 verificados
echo.

echo 🚀 Ejecutando PASO 3: Limpieza segura...
echo.

REM Ejecutar el script de limpieza
node PASO-3-LIMPIEZA-SEGURA-TABLAS-DUPLICADAS.js

REM Verificar el resultado
if errorlevel 1 (
    echo.
    echo ❌ Error durante la limpieza
    echo 📋 Revisa los logs para más detalles
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   PASO 3: LIMPIEZA COMPLETADA EXITOSAMENTE
echo ============================================================
echo.
echo ✅ Tablas duplicadas eliminadas
echo ✅ Esquema principal preservado
echo ✅ Backups de seguridad disponibles
echo.
echo 📄 Revisa el reporte generado para más detalles
echo.
echo 🎯 SISTEMA DE LIMPIEZA COMPLETADO
echo 📋 El esquema de Supabase está ahora optimizado y limpio
echo.

pause
