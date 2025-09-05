@echo off
echo ===============================================================================
echo 🚀 TESTING EXHAUSTIVO - NUEVOS WARNINGS SUPABASE PERFORMANCE ADVISOR
echo ===============================================================================
echo.
echo Este script ejecuta testing exhaustivo completo de la solucion implementada
echo para los 5 nuevos warnings detectados por Supabase Performance Advisor:
echo.
echo ✅ 4x Multiple Permissive Policies (community_profiles)
echo ✅ 1x Duplicate Index (users)
echo.
echo Incluye:
echo • Testing Critico - Validacion de warnings eliminados
echo • Testing de Rendimiento - Mejoras en consultas
echo • Testing de Regresion - Funcionalidad existente
echo • Testing de Edge Cases - Casos extremos
echo • Testing de Monitoreo - Funciones de utilidad
echo • Testing de Stress - Pruebas de carga
echo.
echo ===============================================================================

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si el archivo de testing existe
if not exist "TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-COMPLETO-FINAL.js" (
    echo ❌ ERROR: No se encuentra el archivo de testing
    echo    TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-COMPLETO-FINAL.js
    echo.
    pause
    exit /b 1
)

REM Verificar variables de entorno
echo 🔧 Verificando configuracion...
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ❌ ERROR: Variable NEXT_PUBLIC_SUPABASE_URL no configurada
    echo.
    echo Por favor configura las variables de entorno de Supabase:
    echo • NEXT_PUBLIC_SUPABASE_URL
    echo • SUPABASE_SERVICE_ROLE_KEY
    echo • NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo.
    pause
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ ERROR: Variable SUPABASE_SERVICE_ROLE_KEY no configurada
    echo.
    pause
    exit /b 1
)

if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo ❌ ERROR: Variable NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada
    echo.
    pause
    exit /b 1
)

echo ✅ Variables de entorno configuradas correctamente
echo.

REM Verificar dependencias de Node.js
echo 🔧 Verificando dependencias...
if not exist "node_modules" (
    echo ⚠️  Directorio node_modules no encontrado
    echo 📦 Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Fallo al instalar dependencias
        pause
        exit /b 1
    )
)

REM Verificar si @supabase/supabase-js está instalado
npm list @supabase/supabase-js >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Fallo al instalar @supabase/supabase-js
        pause
        exit /b 1
    )
)

echo ✅ Dependencias verificadas
echo.

REM Crear directorio de reportes si no existe
if not exist "reportes-testing" (
    mkdir "reportes-testing"
)

echo ===============================================================================
echo 🧪 INICIANDO TESTING EXHAUSTIVO
echo ===============================================================================
echo.
echo ⏰ Inicio: %date% %time%
echo.

REM Ejecutar el testing exhaustivo
node "TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-COMPLETO-FINAL.js"

REM Capturar el código de salida
set TESTING_EXIT_CODE=%errorlevel%

echo.
echo ⏰ Fin: %date% %time%
echo.

REM Mostrar resultados
if %TESTING_EXIT_CODE% equ 0 (
    echo ===============================================================================
    echo 🎉 TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE
    echo ===============================================================================
    echo.
    echo ✅ Todos los tests pasaron correctamente
    echo ✅ Los warnings de Supabase Performance Advisor han sido resueltos
    echo ✅ La solucion esta lista para implementacion en produccion
    echo.
    echo 📄 Reportes generados:
    echo • REPORTE-TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-FINAL.json
    echo.
    echo 💡 Proximos pasos:
    echo 1. Revisar el reporte detallado generado
    echo 2. Implementar la solucion en Supabase Dashboard
    echo 3. Verificar en Performance Advisor que los warnings desaparecieron
    echo.
) else (
    echo ===============================================================================
    echo ⚠️  TESTING EXHAUSTIVO COMPLETADO CON ERRORES
    echo ===============================================================================
    echo.
    echo ❌ Algunos tests fallaron (Codigo de salida: %TESTING_EXIT_CODE%)
    echo.
    echo 📄 Revisar el reporte detallado para mas informacion:
    echo • REPORTE-TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-FINAL.json
    echo.
    echo 💡 Acciones recomendadas:
    echo 1. Revisar los errores en el reporte
    echo 2. Corregir los problemas identificados
    echo 3. Volver a ejecutar el testing
    echo 4. No implementar en produccion hasta resolver todos los errores
    echo.
)

echo ===============================================================================
echo 📊 RESUMEN DE ARCHIVOS GENERADOS
echo ===============================================================================
echo.

REM Mostrar archivos generados
if exist "REPORTE-TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-FINAL.json" (
    echo ✅ REPORTE-TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-FINAL.json
    echo    ^| Reporte completo con todos los resultados del testing
)

if exist "SOLUCION-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.sql" (
    echo ✅ SOLUCION-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.sql
    echo    ^| Script SQL con la solucion a implementar
)

if exist "TESTING-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.js" (
    echo ✅ TESTING-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.js
    echo    ^| Script de testing basico (8 tests)
)

echo ✅ TESTING-EXHAUSTIVO-NUEVOS-WARNINGS-SUPABASE-COMPLETO-FINAL.js
echo    ^| Script de testing exhaustivo (16 tests)

echo.
echo ===============================================================================
echo 📋 GUIA DE IMPLEMENTACION
echo ===============================================================================
echo.
echo Para implementar la solucion en Supabase:
echo.
echo 1. 🔐 Acceder a Supabase Dashboard
echo    • Ir a: https://supabase.com/dashboard
echo    • Seleccionar tu proyecto
echo.
echo 2. 📝 Ejecutar el script SQL
echo    • Ir a SQL Editor
echo    • Copiar contenido de: SOLUCION-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.sql
echo    • Ejecutar el script completo
echo.
echo 3. ✅ Verificar en Performance Advisor
echo    • Ir a Settings ^> Performance
echo    • Verificar que los 5 warnings han desaparecido:
echo      - 4x Multiple Permissive Policies (community_profiles)
echo      - 1x Duplicate Index (users)
echo.
echo 4. 🧪 Testing post-implementacion
echo    • Ejecutar consultas de prueba en community_profiles
echo    • Verificar que las funciones de utilidad funcionan
echo    • Monitorear rendimiento de consultas
echo.
echo ===============================================================================

echo.
echo Presiona cualquier tecla para salir...
pause >nul

exit /b %TESTING_EXIT_CODE%
