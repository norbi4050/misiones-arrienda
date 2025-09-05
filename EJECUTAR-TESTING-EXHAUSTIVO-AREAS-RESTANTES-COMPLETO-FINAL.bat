@echo off
chcp 65001 >nul
title TESTING EXHAUSTIVO COMPLETO - ÁREAS RESTANTES

echo ============================================================
echo   TESTING EXHAUSTIVO COMPLETO - ÁREAS RESTANTES
echo ============================================================
echo.
echo 🚀 Iniciando testing exhaustivo de todas las áreas restantes...
echo 📅 Fecha: %date% %time%
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    echo 💡 Instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente
echo.

:: Ejecutar testing exhaustivo completo
echo 🧪 Ejecutando testing exhaustivo completo...
echo.

node TESTING-EXHAUSTIVO-AREAS-RESTANTES-COMPLETO-FINAL.js

if errorlevel 1 (
    echo.
    echo ❌ Error durante el testing exhaustivo
    echo 📋 Revisa los logs para más detalles
    pause
    exit /b 1
)

echo.
echo ✅ Testing exhaustivo completado exitosamente
echo 📄 Reporte generado: REPORTE-TESTING-EXHAUSTIVO-AREAS-RESTANTES-COMPLETADO-FINAL.md
echo.
echo ============================================================
echo   TESTING EXHAUSTIVO COMPLETO - FINALIZADO
echo ============================================================
echo.

pause
