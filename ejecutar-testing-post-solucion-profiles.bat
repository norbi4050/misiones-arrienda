@echo off
echo.
echo ========================================
echo 🧪 TESTING POST-SOLUCION PROFILES TABLE
echo ========================================
echo.
echo Este script verifica que el error de registro este solucionado
echo despues de aplicar la correccion a la tabla profiles.
echo.
echo ========================================
echo 🎯 OBJETIVO DEL TESTING:
echo ========================================
echo.
echo Verificar que el error:
echo "column email of relation profiles does not exist"
echo ya NO aparezca al registrar usuarios.
echo.
echo ========================================
echo 🚀 EJECUTANDO TESTING...
echo ========================================
echo.

node test-registro-post-solucion-profiles.js

echo.
echo ========================================
echo ✅ TESTING COMPLETADO
echo ========================================
echo.
echo Si el testing muestra "EXITO TOTAL", significa que:
echo - La tabla profiles tiene todas las columnas necesarias
echo - El trigger automatico funciona correctamente
echo - Los usuarios pueden registrarse sin problemas
echo.
echo Si hay errores, revisa:
echo - Que el script SQL se haya ejecutado correctamente
echo - Que todas las columnas esten creadas en Supabase
echo - Que el trigger este activo
echo.
pause
