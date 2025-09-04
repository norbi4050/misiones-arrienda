@echo off
echo ================================================================
echo 🚀 EJECUTANDO CORRECCIÓN AUTOMÁTICA DE SUPABASE - PERFIL USUARIO
echo ================================================================
echo.

echo 📋 Instalando dependencias necesarias...
npm install @supabase/supabase-js

echo.
echo 📋 Ejecutando script de corrección automática...
node ejecutar-correccion-supabase-perfil-usuario.js

echo.
echo ================================================================
echo ✅ CORRECCIÓN COMPLETADA
echo ================================================================
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Revisa el reporte generado: REPORTE-CORRECCION-SUPABASE-PERFIL-USUARIO-FINAL.json
echo 2. Reinicia tu servidor local: npm run dev
echo 3. Prueba el endpoint: GET /api/users/profile
echo 4. Verifica el formulario de perfil en el frontend
echo.
pause
