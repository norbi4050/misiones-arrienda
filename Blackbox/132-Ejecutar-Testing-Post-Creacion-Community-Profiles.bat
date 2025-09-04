@echo off
echo ========================================
echo BLACKBOX AI - TESTING POST-CREACION COMMUNITY_PROFILES
echo Fecha: 3 de Enero 2025
echo ========================================
echo.

echo 🔍 Ejecutando testing exhaustivo de tabla community_profiles...
echo.

cd /d "%~dp0.."
node "Blackbox/131-Testing-Post-Creacion-Tabla-Community-Profiles.js"

echo.
echo ✅ Testing completado
echo 📄 Revisa el reporte en: Blackbox/131-Reporte-Testing-Community-Profiles.json
echo.
pause
