@echo off
echo =====================================================
echo EJECUTANDO TESTING EXHAUSTIVO: PERFORMANCE ADVISOR WARNINGS
echo =====================================================
echo.
echo Verificando corrección de 74 warnings de performance:
echo - Auth RLS Initialization Plan: 19 warnings
echo - Multiple Permissive Policies: 52 warnings  
echo - Duplicate Index: 3 warnings
echo.
echo =====================================================

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm está disponible
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)

echo ✅ Node.js y npm están disponibles
echo.

REM Verificar si las variables de entorno están configuradas
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ⚠️  ADVERTENCIA: NEXT_PUBLIC_SUPABASE_URL no está configurada
    echo Configurando variable temporal para testing...
    set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ⚠️  ADVERTENCIA: SUPABASE_SERVICE_ROLE_KEY no está configurada
    echo Configurando variable temporal para testing...
    set SUPABASE_SERVICE_ROLE_KEY=your-service-key
)

echo.
echo 🔧 Variables de entorno configuradas:
echo SUPABASE_URL: %NEXT_PUBLIC_SUPABASE_URL%
echo SERVICE_KEY: [OCULTA POR SEGURIDAD]
echo.

REM Verificar si @supabase/supabase-js está instalado
if not exist "node_modules\@supabase\supabase-js" (
    echo 📦 Instalando dependencias de Supabase...
    npm install @supabase/supabase-js
    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudo instalar @supabase/supabase-js
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas correctamente
    echo.
)

echo 🚀 Iniciando testing exhaustivo de Performance Advisor Warnings...
echo.

REM Ejecutar el script de testing
node TESTING-EXHAUSTIVO-PERFORMANCE-ADVISOR-WARNINGS-COMPLETO.js

REM Verificar el resultado
if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡TESTING COMPLETADO EXITOSAMENTE!
    echo.
    echo 📋 PRÓXIMOS PASOS:
    echo 1. Ve a Supabase Dashboard ^> Database ^> Database Linter
    echo 2. Ejecuta el Performance Advisor nuevamente
    echo 3. Verifica que los 74 warnings desaparecieron
    echo 4. Monitorea el rendimiento en producción
    echo.
    echo 🎉 Las optimizaciones de performance se aplicaron correctamente
) else (
    echo.
    echo ❌ TESTING FALLÓ - Revisa los errores anteriores
    echo.
    echo 💡 POSIBLES SOLUCIONES:
    echo 1. Verifica que las variables de entorno estén correctas
    echo 2. Asegúrate de que Supabase esté accesible
    echo 3. Ejecuta el script SQL de optimización primero
    echo 4. Revisa los logs de error para más detalles
)

echo.
echo =====================================================
echo Testing de Performance Advisor Warnings completado
echo =====================================================
echo.
pause
