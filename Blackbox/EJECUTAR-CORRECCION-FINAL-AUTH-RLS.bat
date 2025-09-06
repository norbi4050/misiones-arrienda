@echo off
echo =====================================================
echo CORRECCIÓN FINAL AUTH RLS - ELIMINACIÓN WARNINGS
echo =====================================================
echo.
echo Este script ejecutará la corrección final de los
echo warnings de rendimiento auth_rls_initplan
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

echo.
echo PASO 1: Ejecutando corrección de políticas...
echo ==============================================

REM Ejecutar el SQL de corrección
type Blackbox\SQL-CORRECCION-FINAL-AUTH-RLS.sql

echo.
echo PASO 2: Verificación de corrección...
echo ======================================

REM Ejecutar verificación
type Blackbox\VERIFICACION-FINAL-AUTH-RLS.sql

echo.
echo =====================================================
echo CORRECCIÓN COMPLETADA
echo =====================================================
echo.
echo Próximos pasos:
echo 1. Copia y pega el SQL en Supabase SQL Editor
echo 2. Ejecuta el SQL completo
echo 3. Ve a Database > Linter en Supabase Dashboard
echo 4. Verifica que no hay warnings auth_rls_initplan
echo.
echo ¡Corrección final completada exitosamente!
echo =====================================================
pause
