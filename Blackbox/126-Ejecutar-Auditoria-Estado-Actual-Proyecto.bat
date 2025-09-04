@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR AUDITORIA COMPLETA
echo Fecha: 3 de Enero 2025
echo ========================================
echo.

echo 🔍 Iniciando auditoria completa del estado actual...
echo.

cd /d "%~dp0.."
node "Blackbox/125-Auditoria-Estado-Actual-Proyecto-Completa.js"

echo.
echo ✅ Auditoria completada
echo 📄 Revisa el reporte en: Blackbox/125-Reporte-Auditoria-Estado-Actual.json
echo.
pause
