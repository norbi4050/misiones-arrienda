@echo off
echo ========================================
echo EJECUTANDO SOLUCION AUTOMATICA ERROR REGISTRO
echo ========================================
echo.
echo Aplicando correcciones automaticas para el error "Database error saving new user"
echo Usando credenciales reales de Supabase para implementar soluciones
echo.

cd /d "%~dp0"
cd ..

echo Verificando dependencias necesarias...
call npm install @supabase/supabase-js --save-dev

echo.
echo Ejecutando solucion automatica completa...
node "Blackbox/209-Solucion-Automatica-Error-Registro-Usuario.js"

echo.
echo ========================================
echo SOLUCION AUTOMATICA COMPLETADA
echo ========================================
echo.
echo Revisa los archivos generados:
echo - Blackbox/212-Reporte-Solucion-Automatica-Error-Registro-Final.json
echo - Blackbox/210-Script-SQL-Crear-Tabla-Users-Manual.sql (si se genero)
echo - Blackbox/211-Script-SQL-Politicas-RLS-Users.sql (si se genero)
echo.
echo PROXIMOS PASOS:
echo 1. Si se generaron scripts SQL, ejecutarlos en Supabase Dashboard
echo 2. Ejecutar testing post-solucion para verificar correcciones
echo 3. Probar registro de usuario en la aplicacion
echo.
echo IMPORTANTE: Si hay scripts SQL generados, debes ejecutarlos
echo manualmente en el SQL Editor de Supabase Dashboard antes de continuar.
echo.
pause
