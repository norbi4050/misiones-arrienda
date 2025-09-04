@echo off
echo =====================================================
echo EJECUTANDO TESTING EXHAUSTIVO DEL SCRIPT SQL SUPABASE
echo =====================================================
echo.

echo Verificando dependencias de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando si @supabase/supabase-js está instalado...
cd Backend
if not exist node_modules\@supabase\supabase-js (
    echo Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo instalar @supabase/supabase-js
        pause
        exit /b 1
    )
)

cd ..
echo.
echo Ejecutando testing exhaustivo...
echo.

node TESTING-EXHAUSTIVO-SUPABASE-SCRIPT-SQL-COMPLETO.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ TESTING COMPLETADO CON ERRORES
    echo Revisa el archivo REPORTE-TESTING-EXHAUSTIVO-SUPABASE-SQL-FINAL.json para más detalles
) else (
    echo.
    echo ✅ TESTING COMPLETADO EXITOSAMENTE
    echo Revisa el archivo REPORTE-TESTING-EXHAUSTIVO-SUPABASE-SQL-FINAL.json para el reporte completo
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
