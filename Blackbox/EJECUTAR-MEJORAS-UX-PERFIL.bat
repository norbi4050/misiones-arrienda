@echo off
echo.
echo ========================================
echo   EJECUTAR MEJORAS UX PERFIL USUARIO
echo ========================================
echo.
echo Fecha: %date% %time%
echo Responsable: BlackBox AI
echo Objetivo: Implementar mejoras de UX recomendadas
echo.

echo [PASO 1] Verificando estado actual...
node "Blackbox/verificador-estado-supabase-automatico.js"

echo.
echo [PASO 2] Aplicando mejoras de UX...
node "Blackbox/implementar-mejoras-ux-perfil.js"

echo.
echo [PASO 3] Testing de mejoras implementadas...
node "Blackbox/test-mejoras-ux-perfil.js"

echo.
echo ========================================
echo   MEJORAS UX COMPLETADAS
echo ========================================
echo.
echo Revisa el reporte generado:
echo REPORTE-MEJORAS-UX-PERFIL-IMPLEMENTADAS.md
echo.
pause
