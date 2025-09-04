@echo off
echo =====================================================
echo 🧪 EJECUTANDO TESTING EXHAUSTIVO POST-DIAGNOSTICO COMPLETO
echo =====================================================
echo.
echo Este script ejecutará un testing exhaustivo completo después
echo de aplicar la solución definitiva para el error de la tabla profiles
echo.
echo Fases del testing:
echo 1. Verificación de estructura de base de datos
echo 2. Testing de registro de usuarios (todos los tipos)
echo 3. Testing de casos edge
echo 4. Testing de integración con APIs
echo 5. Testing de configuración SMTP
echo 6. Testing de flujos completos
echo.
echo ⚠️  IMPORTANTE: Asegúrate de que:
echo    - Las variables de entorno de Supabase estén configuradas
echo    - El servidor de desarrollo esté ejecutándose
echo    - La solución SQL haya sido aplicada previamente
echo.
pause

echo.
echo 📋 Verificando dependencias...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 🔧 Instalando dependencias necesarias...
cd /d "%~dp0"

REM Verificar si estamos en el directorio correcto
if not exist "Backend" (
    echo ❌ ERROR: Directorio Backend no encontrado
    echo    Asegúrate de ejecutar este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

cd Backend

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias del proyecto...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
)

REM Verificar dependencias específicas para testing
echo 📦 Verificando dependencias de testing...
npm list @supabase/supabase-js >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
)

npm list nodemailer >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Instalando nodemailer...
    npm install nodemailer
)

echo ✅ Dependencias verificadas
echo.

echo 🚀 Ejecutando testing exhaustivo...
cd ..
node testing-exhaustivo-post-diagnostico-completo.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ TESTING COMPLETADO EXITOSAMENTE
    echo.
    echo 📊 Revisa los resultados arriba para ver:
    echo    - Tasa de éxito general
    echo    - Detalles de cada fase de testing
    echo    - Problemas detectados (si los hay)
    echo.
    echo 📝 Se recomienda:
    echo    1. Revisar cualquier test fallido
    echo    2. Corregir problemas identificados
    echo    3. Re-ejecutar el testing si es necesario
    echo.
) else (
    echo.
    echo ❌ TESTING COMPLETADO CON ERRORES
    echo.
    echo 🔍 Revisa los errores arriba y:
    echo    1. Verifica la configuración de Supabase
    echo    2. Asegúrate de que el servidor esté ejecutándose
    echo    3. Confirma que la solución SQL fue aplicada
    echo    4. Revisa las variables de entorno
    echo.
)

echo.
echo 📋 PRÓXIMOS PASOS RECOMENDADOS:
echo.
if %errorlevel% equ 0 (
    echo ✅ Si el testing fue exitoso:
    echo    1. El sistema está listo para uso
    echo    2. Puedes proceder con testing manual adicional
    echo    3. Considera implementar mejoras identificadas
    echo.
) else (
    echo ⚠️  Si hubo errores:
    echo    1. Revisa los logs de error detallados arriba
    echo    2. Corrige los problemas identificados
    echo    3. Re-ejecuta este script
    echo    4. Contacta soporte si persisten los problemas
    echo.
)

echo 🔗 RECURSOS ADICIONALES:
echo    - SOLUCION-DEFINITIVA-ERROR-PROFILES-TABLE-COMPLETA.sql
echo    - Backend/GUIA-CONFIGURACION-SUPABASE-COMPLETA-DEFINITIVA.md
echo    - VARIABLES-ENTORNO-VERCEL-COMPLETAS-DEFINITIVAS.md
echo.

pause
