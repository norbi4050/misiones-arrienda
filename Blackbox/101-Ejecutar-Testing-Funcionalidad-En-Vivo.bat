@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR TESTING FUNCIONALIDAD EN VIVO
echo Archivo: 101-Ejecutar-Testing-Funcionalidad-En-Vivo.bat
echo Fecha: 3/9/2025
echo Estado: ACTIVO
echo ========================================

echo.
echo 🚀 INICIANDO TESTING FUNCIONALIDAD EN VIVO...
echo.

:: Verificar que Node.js esté disponible
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo 📋 Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar que el servidor esté corriendo
echo 🔍 Verificando que el servidor esté funcionando...
timeout /t 2 /nobreak >nul

:: Ejecutar el script de testing
echo 📊 Ejecutando tests de funcionalidad...
node "Blackbox/100-Testing-Funcionalidad-En-Vivo-Completo.js"

if errorlevel 1 (
    echo.
    echo ❌ ERROR: El testing falló
    echo 📋 Revisa los logs anteriores para más detalles
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ TESTING FUNCIONALIDAD EN VIVO COMPLETADO
echo 📄 Reporte generado: Blackbox/101-Reporte-Testing-Funcionalidad-En-Vivo-Final.md
echo.

:: Mostrar el reporte si existe
if exist "Blackbox\101-Reporte-Testing-Funcionalidad-En-Vivo-Final.md" (
    echo 📖 Abriendo reporte...
    start "" "Blackbox\101-Reporte-Testing-Funcionalidad-En-Vivo-Final.md"
)

echo 🎉 PROCESO COMPLETADO EXITOSAMENTE
pause
