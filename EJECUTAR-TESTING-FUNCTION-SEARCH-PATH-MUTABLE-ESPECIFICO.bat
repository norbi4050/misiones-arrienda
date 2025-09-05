@echo off
echo =====================================================
echo EJECUTANDO TESTING ESPECÍFICO: FUNCTION SEARCH PATH MUTABLE
echo =====================================================
echo.
echo Verificando corrección de 2 warnings específicos:
echo - Function public.update_user_profile has a role mutable search_path
echo - Function public.validate_operation_type has a role mutable search_path
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
    set NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxyemmnohqdele.supabase.co
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ⚠️  ADVERTENCIA: SUPABASE_SERVICE_ROLE_KEY no está configurada
    echo Configurando variable temporal para testing...
    set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM
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

echo 🚀 Iniciando testing específico de Function Search Path Mutable...
echo.

REM Ejecutar el script de testing
node TESTING-FUNCTION-SEARCH-PATH-MUTABLE-ESPECIFICO-FINAL.js

REM Verificar el resultado
if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡TESTING COMPLETADO EXITOSAMENTE!
    echo.
    echo 📋 PRÓXIMOS PASOS:
    echo 1. Ve a Supabase Dashboard ^> Database ^> Database Linter
    echo 2. Ejecuta el Performance Advisor nuevamente
    echo 3. Verifica que los 2 warnings de Function Search Path Mutable desaparecieron
    echo 4. Confirma que las funciones funcionan correctamente en la aplicación
    echo.
    echo 🎉 Las funciones tienen search_path fijo configurado correctamente
) else (
    echo.
    echo ❌ TESTING FALLÓ - Revisa los errores anteriores
    echo.
    echo 💡 POSIBLES SOLUCIONES:
    echo 1. Verifica que las variables de entorno estén correctas
    echo 2. Asegúrate de que Supabase esté accesible
    echo 3. Ejecuta el script SQL de corrección primero
    echo 4. Revisa los logs de error para más detalles
)

echo.
echo =====================================================
echo Testing de Function Search Path Mutable completado
echo =====================================================
echo.
pause
