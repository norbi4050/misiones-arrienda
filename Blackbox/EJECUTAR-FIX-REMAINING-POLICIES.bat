@echo off
echo =====================================================
echo EJECUTANDO FIX PARA POLÍTICAS PROBLEMÁTICAS RESTANTES
echo =====================================================
echo Fecha: %DATE% %TIME%
echo =====================================================
echo.

cd /d "%~dp0"

echo Ejecutando script de corrección...
node aplicar-fix-remaining-problematic-policies.js

echo.
echo =====================================================
echo PROCESO COMPLETADO
echo =====================================================
echo Verifique el archivo REPORTE-FIX-REMAINING-POLICIES.json
echo para confirmar que las políticas se corrigieron correctamente.
echo.
pause
