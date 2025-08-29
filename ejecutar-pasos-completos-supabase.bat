@echo off
echo.
echo ========================================
echo 🚀 EJECUTANDO PASOS COMPLETOS SUPABASE
echo ========================================
echo.

echo 📋 PASO 1: Verificando variables de entorno...
node verificar-variables-supabase.js
echo.

echo 📋 PASO 2: Middleware ya activado ✅
echo.

echo 📋 PASO 3: Iniciando servidor de desarrollo...
echo ⚠️  IMPORTANTE: El servidor se iniciará en una nueva ventana
echo ⚠️  NO CIERRES esa ventana durante el testing
echo.
start "Servidor Misiones Arrienda" cmd /k "cd Backend && npm run dev"

echo 📋 PASO 4: Esperando que el servidor inicie...
timeout /t 10 /nobreak > nul

echo 📋 PASO 5: Ejecutando testing exhaustivo...
echo.
node test-integracion-supabase-autenticacion-completo.js

echo.
echo ========================================
echo ✅ PROCESO COMPLETADO
echo ========================================
echo.
echo 📊 Revisa el reporte generado para ver los resultados
echo 🌐 El servidor sigue ejecutándose en la otra ventana
echo 🔧 Para detener el servidor, cierra la ventana del servidor
echo.
pause
