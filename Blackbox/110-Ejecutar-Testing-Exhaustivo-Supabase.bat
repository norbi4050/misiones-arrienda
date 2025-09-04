@echo off
REM =====================================================
REM BLACKBOX AI - EJECUTAR TESTING EXHAUSTIVO SUPABASE
REM Archivo: 110-Ejecutar-Testing-Exhaustivo-Supabase.bat
REM Fecha: 3/9/2025
REM Estado: ✅ LISTO PARA EJECUTAR
REM =====================================================

echo.
echo ========================================
echo BLACKBOX AI - TESTING EXHAUSTIVO SUPABASE
echo ========================================
echo.
echo 🚀 Iniciando testing exhaustivo con credenciales reales...
echo 📅 Fecha: %date% %time%
echo 🔗 URL: https://qfeyhaaxyemmnohqdele.supabase.co
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo 📥 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm está disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)

echo ✅ Node.js y npm detectados correctamente
echo.

REM Instalar dependencias de Supabase si no están instaladas
echo 📦 Verificando dependencias de Supabase...
npm list @supabase/supabase-js >nul 2>&1
if errorlevel 1 (
    echo 📥 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ❌ ERROR: No se pudo instalar @supabase/supabase-js
        pause
        exit /b 1
    )
)

echo ✅ Dependencias verificadas
echo.

REM Ejecutar el testing exhaustivo
echo 🔍 Ejecutando testing exhaustivo de Supabase...
echo.
node "Blackbox/109-Testing-Exhaustivo-Configuracion-Supabase-Con-Credenciales.js"

REM Verificar el resultado
if errorlevel 1 (
    echo.
    echo ❌ TESTING COMPLETADO CON ERRORES
    echo 📊 Revisa el reporte generado para ver los detalles
    echo 📁 Archivo: Blackbox/110-Reporte-Testing-Exhaustivo-Supabase-Final.json
) else (
    echo.
    echo ✅ TESTING COMPLETADO EXITOSAMENTE
    echo 📊 Reporte generado correctamente
    echo 📁 Archivo: Blackbox/110-Reporte-Testing-Exhaustivo-Supabase-Final.json
)

echo.
echo ========================================
echo TESTING EXHAUSTIVO COMPLETADO
echo ========================================
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Revisar el reporte JSON generado
echo 2. Ejecutar scripts de configuración si hay errores
echo 3. Verificar configuraciones manuales pendientes
echo.

REM Preguntar si abrir el reporte
set /p ABRIR_REPORTE="¿Deseas abrir el reporte generado? (s/n): "
if /i "%ABRIR_REPORTE%"=="s" (
    if exist "Blackbox\110-Reporte-Testing-Exhaustivo-Supabase-Final.json" (
        start "" "Blackbox\110-Reporte-Testing-Exhaustivo-Supabase-Final.json"
    ) else (
        echo ⚠️  Archivo de reporte no encontrado
    )
)

echo.
echo 🎉 Proceso completado. Presiona cualquier tecla para salir...
pause >nul
