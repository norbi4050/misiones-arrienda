@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR SCRIPT SQL COMMUNITY_PROFILES
echo Fecha: 3 de Enero 2025
echo ========================================
echo.

echo 🚀 Ejecutando script automatizado para crear tabla community_profiles...
echo.

cd /d "%~dp0.."
node "Blackbox/128-Script-Ejecutar-SQL-Community-Profiles-Automatico.js"

echo.
echo ✅ Script ejecutado
echo 📄 Revisa el reporte en: Blackbox/128-Reporte-Ejecucion-SQL-Community-Profiles.json
echo.
pause
