@echo off
echo ========================================
echo EJECUTANDO DIAGNOSTICO ERROR REGISTRO USUARIO
echo ========================================
echo.
echo Diagnosticando problema "Database error saving new user"
echo Usando credenciales reales de Supabase para analisis completo
echo.

cd /d "%~dp0"
cd ..

echo Verificando dependencias necesarias...
call npm install @supabase/supabase-js --save-dev

echo.
echo Ejecutando diagnostico completo...
node "Blackbox/207-Diagnostico-Error-Registro-Usuario-Database-Error.js"

echo.
echo ========================================
echo DIAGNOSTICO COMPLETADO
echo ========================================
echo.
echo Revisa el archivo de reporte generado:
echo Blackbox/208-Reporte-Diagnostico-Error-Registro-Final.json
echo.
echo PROXIMOS PASOS:
echo 1. Revisar reporte de diagnostico
echo 2. Ejecutar script de solucion automatica
echo 3. Probar registro de usuario nuevamente
echo.
pause
