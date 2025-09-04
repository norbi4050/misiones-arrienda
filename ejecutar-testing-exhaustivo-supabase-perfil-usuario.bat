@echo off
echo ================================================================
echo 🚀 EJECUTANDO TESTING EXHAUSTIVO - SUPABASE PERFIL USUARIO
echo ================================================================
echo.

echo 📋 Instalando dependencias necesarias...
npm install @supabase/supabase-js

echo.
echo 📋 Ejecutando testing exhaustivo completo...
node testing-exhaustivo-supabase-perfil-usuario-completo.js

echo.
echo ================================================================
echo ✅ TESTING EXHAUSTIVO COMPLETADO
echo ================================================================
echo.
echo 📋 ARCHIVOS GENERADOS:
echo - REPORTE-TESTING-EXHAUSTIVO-SUPABASE-PERFIL-USUARIO-FINAL.json
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Revisar el reporte JSON generado
echo 2. Si hay errores, ejecutar correcciones automáticas
echo 3. Re-ejecutar testing si es necesario
echo 4. Verificar endpoint en navegador: http://localhost:3000/api/users/profile
echo.
pause
