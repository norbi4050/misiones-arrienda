@echo off
echo.
echo ========================================
echo 🔧 EJECUTANDO SOLUCION ELIMINACION USUARIOS HUERFANOS
echo ========================================
echo.

echo 📋 Usuarios problemáticos a eliminar:
echo - ea3f8926-c74f-4550-a9a2-c0dd0c590a56
echo - ab97f406-06d9-4c65-a7f1-2ff86f7b9d10
echo - 748b3ee3-aedd-43ea-b0bb-7882e66a18bf
echo - eae43255-e16f-4d25-a1b5-d3c0393ec7e3
echo.

echo 🚀 Iniciando proceso de eliminación...
echo.

cd /d "%~dp0"

echo 📦 Instalando dependencias necesarias...
npm install @supabase/supabase-js

echo.
echo 🔍 Ejecutando diagnóstico y eliminación...
node "85-Solucion-Eliminacion-Usuarios-Huerfanos-Supabase.js"

echo.
echo ✅ Proceso completado.
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Revisar el reporte generado arriba
echo 2. Verificar en Supabase Dashboard que los usuarios fueron eliminados
echo 3. Probar eliminar usuarios desde el panel de administración
echo.

pause
