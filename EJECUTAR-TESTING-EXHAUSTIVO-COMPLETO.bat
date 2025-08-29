@echo off
echo.
echo ========================================
echo 🚀 TESTING EXHAUSTIVO COMPLETO
echo ========================================
echo 🎯 Misiones Arrienda - Validacion Pre-Lanzamiento
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    echo 📥 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

REM Verificar si existe el archivo de testing
if not exist "TESTING-EXHAUSTIVO-COMPLETO-INICIANDO.js" (
    echo ❌ Error: Archivo de testing no encontrado
    echo 📁 Verifica que TESTING-EXHAUSTIVO-COMPLETO-INICIANDO.js existe
    pause
    exit /b 1
)

echo 📋 Iniciando testing exhaustivo...
echo.

REM Ejecutar el script de testing
node TESTING-EXHAUSTIVO-COMPLETO-INICIANDO.js

REM Verificar si se generó el reporte
if exist "REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md" (
    echo.
    echo ✅ Reporte generado exitosamente
    echo 📄 Archivo: REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md
    echo.
    echo 🔍 ¿Deseas abrir el reporte? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        start "" "REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md"
    )
) else (
    echo.
    echo ⚠️ No se pudo generar el reporte
    echo 🔍 Revisa los errores mostrados arriba
)

echo.
echo ========================================
echo 🎊 TESTING EXHAUSTIVO COMPLETADO
echo ========================================
echo.
pause
