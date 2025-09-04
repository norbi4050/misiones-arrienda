@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR CREACION COMMUNITY_PROFILES CORREGIDO
echo Fecha: 3 de Enero 2025
echo ========================================
echo.

echo 🚀 Iniciando creacion automatica de tabla community_profiles...
echo.

cd /d "%~dp0"
cd ..

echo 📦 Instalando dependencias necesarias...
npm install @supabase/supabase-js --save-dev

echo.
echo ⚡ Ejecutando script de creacion corregido...
node "Blackbox/136-Script-Creacion-Automatica-Community-Profiles-Con-Credenciales-Reales-CORREGIDO.js"

echo.
echo ✅ Proceso completado!
echo.
echo 📋 PROXIMOS PASOS:
echo    1. Verificar la tabla en Supabase Dashboard
echo    2. Continuar con el paso 6.3 de la guia manual
echo    3. Probar las APIs del modulo comunidad
echo.
pause
