@echo off
echo ===============================================
echo EJECUTANDO TESTING OPTIMIZACION DATABASE LINTER
echo Fecha: %date% %time%
echo ===============================================

echo.
echo [INFO] Iniciando testing de optimizaciones Database Linter...
echo [INFO] Verificando que las optimizaciones se aplicaron correctamente
echo.

echo [PASO 1] Verificando Node.js y dependencias...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [PASO 2] Instalando dependencias necesarias...
cd /d "%~dp0..\Backend"
if not exist "node_modules" (
    echo [INFO] Instalando dependencias del proyecto...
    npm install
)

echo [PASO 3] Verificando dependencia @supabase/supabase-js...
npm list @supabase/supabase-js >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
)

echo.
echo ===============================================
echo EJECUTANDO TESTING DE OPTIMIZACION
echo ===============================================
echo.

echo [INFO] Ejecutando script de testing...
cd /d "%~dp0"
node "80-Testing-Optimizacion-Database-Linter.js"

echo.
echo ===============================================
echo VERIFICANDO RESULTADOS
echo ===============================================
echo.

if exist "81-Reporte-Testing-Optimizacion-Database-Linter-Final.md" (
    echo ✅ Reporte generado exitosamente
    echo 📄 Archivo: 81-Reporte-Testing-Optimizacion-Database-Linter-Final.md
) else (
    echo ❌ Error: No se genero el reporte
)

if exist "81-Reporte-Testing-Optimizacion-Database-Linter-Final.json" (
    echo ✅ Datos JSON generados exitosamente
    echo 📊 Archivo: 81-Reporte-Testing-Optimizacion-Database-Linter-Final.json
) else (
    echo ❌ Error: No se generaron los datos JSON
)

echo.
echo ===============================================
echo PROXIMOS PASOS
echo ===============================================
echo.
echo 1. Revisar el reporte generado
echo 2. Si hay tests fallidos, aplicar el script SQL:
echo    "78-Optimizacion-Database-Linter-Supabase-Completa.sql"
echo 3. Ejecutar este testing nuevamente en 24-48 horas
echo 4. Monitorear el rendimiento de la base de datos
echo.
echo ===============================================
echo TESTING COMPLETADO
echo ===============================================
echo.
echo Presiona cualquier tecla para abrir el reporte...
pause >nul

if exist "81-Reporte-Testing-Optimizacion-Database-Linter-Final.md" (
    start "" "81-Reporte-Testing-Optimizacion-Database-Linter-Final.md"
)

echo.
echo ¡Testing de optimizacion Database Linter completado!
echo Revisa los archivos generados para ver los resultados detallados.
