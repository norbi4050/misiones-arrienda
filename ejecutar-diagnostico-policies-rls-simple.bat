@echo off
echo ============================================================================
echo 🔍 EJECUTANDO DIAGNÓSTICO SIMPLE DE POLÍTICAS RLS EN SUPABASE
echo ============================================================================
echo.
echo ⏰ Iniciando diagnóstico: %date% %time%
echo 🔗 Supabase URL: https://qfeyhaaxyemmnohqdele.supabase.co
echo 📋 Método: Diagnóstico básico usando Anon Key
echo.

node diagnostico-policies-rls-simple.js

echo.
echo ============================================================================
echo ✅ DIAGNÓSTICO SIMPLE FINALIZADO
echo ============================================================================
echo.
echo 📊 Este diagnóstico básico nos ayudará a identificar:
echo    - Qué tablas existen y cuáles faltan
echo    - Cuáles tienen RLS activo o desactivado
echo    - Problemas de acceso y permisos
echo    - Próximos pasos para configurar políticas
echo.
echo 💡 Con esta información podremos crear las políticas exactas necesarias
echo.
pause
