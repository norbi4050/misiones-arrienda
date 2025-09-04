@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR TESTING EXHAUSTIVO DE ERRORES DETECTADOS
echo Archivo: 99-Ejecutar-Testing-Errores-Detectados-Auditoria.bat
echo Fecha: 2025-01-03
echo ========================================

echo.
echo 🔍 Iniciando testing exhaustivo de errores detectados en auditoria...
echo.

cd /d "%~dp0.."

echo 📁 Directorio actual: %CD%
echo.

echo 🚀 Ejecutando script de testing...
node "Blackbox/98-Script-Testing-Errores-Detectados-Auditoria.js"

echo.
echo ========================================
echo ✅ TESTING COMPLETADO
echo 📝 Revisa el reporte generado en:
echo    Blackbox/99-Reporte-Testing-Errores-Detectados-Final.md
echo ========================================

pause
