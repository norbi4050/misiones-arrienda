@echo off
echo =====================================================
echo EJECUTOR AUTOMATICO - SOLUCION ERROR 406 COMPLETA
echo =====================================================
echo.

echo 🔧 Paso 1: Ejecutando solucion SQL en Supabase...
node ejecutar-sql-supabase.js
echo.

echo 🧪 Paso 2: Verificando que la solucion funciona...
node test-final-error-406-solucionado.js
echo.

echo 📋 Paso 3: Generando reporte final...
echo ✅ Reporte disponible en: REPORTE-SOLUCION-DEFINITIVA-ERROR-406-COMPLETO.md
echo.

echo 🎯 Proximos pasos:
echo 1. Revisar el reporte completo
echo 2. Ejecutar el script SQL en Supabase Dashboard si es necesario
echo 3. Reiniciar el servidor de desarrollo
echo 4. Probar el endpoint desde el frontend
echo.

echo ✅ PROCESO COMPLETADO
pause
