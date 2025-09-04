@echo off
echo ========================================
echo 🚀 TESTING EXHAUSTIVO SUPABASE 100%% COMPLETO
echo ========================================
echo.

echo 📋 Verificando dependencias...
cd Backend
if not exist node_modules (
    echo ⚠️  Instalando dependencias...
    npm install
)

echo.
echo 🔄 Ejecutando testing exhaustivo completo...
echo.

node ../TESTING-EXHAUSTIVO-SUPABASE-100-COMPLETO.js

echo.
echo ✅ Testing exhaustivo completado
echo 📄 Revisa los reportes generados:
echo    - REPORTE-TESTING-EXHAUSTIVO-SUPABASE-100-FINAL.json
echo    - REPORTE-ERROR-TESTING-EXHAUSTIVO.json (si hubo errores)
echo.

pause
