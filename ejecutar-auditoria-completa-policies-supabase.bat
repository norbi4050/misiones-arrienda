@echo off
echo ============================================================================
echo 🔍 EJECUTANDO AUDITORÍA COMPLETA DE POLÍTICAS RLS EN SUPABASE
echo ============================================================================
echo.
echo ⏰ Iniciando auditoría: %date% %time%
echo 🔗 Supabase URL: https://qfeyhaaxyemmnohqdele.supabase.co
echo.

node auditoria-completa-policies-supabase-final.js

echo.
echo ============================================================================
echo ✅ AUDITORÍA COMPLETA FINALIZADA
echo ============================================================================
echo.
echo 📊 Revisa los resultados arriba para ver:
echo    - Todas las tablas existentes y su estado RLS
echo    - Todas las políticas configuradas actualmente
echo    - Problemas identificados y soluciones recomendadas
echo.
echo 💡 Con esta información podremos crear las políticas exactas que faltan
echo.
pause
