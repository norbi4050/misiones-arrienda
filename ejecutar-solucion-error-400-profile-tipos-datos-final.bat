@echo off
echo ========================================
echo IMPLEMENTACION SOLUCION ERROR 400 PROFILE
echo ========================================
echo.
echo Este script implementa la solucion definitiva para el error:
echo "invalid input syntax for type integer: \"\""
echo.
echo Basado en los logs reales de Supabase proporcionados.
echo.

echo [PASO 1] Creando backup del archivo actual...
if exist "Backend\src\app\api\users\profile\route.ts" (
    copy "Backend\src\app\api\users\profile\route.ts" "Backend\src\app\api\users\profile\route-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.ts"
    echo ✅ Backup creado exitosamente
) else (
    echo ⚠️  Archivo original no encontrado
)

echo.
echo [PASO 2] Implementando solucion con validacion de tipos...
copy "Backend\src\app\api\users\profile\route-corregido-tipos-datos.ts" "Backend\src\app\api\users\profile\route.ts"
if %errorlevel% == 0 (
    echo ✅ Solucion implementada exitosamente
) else (
    echo ❌ Error al implementar la solucion
    pause
    exit /b 1
)

echo.
echo [PASO 3] Ejecutando testing de la solucion...
node test-solucion-error-400-profile-tipos-datos-final.js

echo.
echo ========================================
echo IMPLEMENTACION COMPLETADA
echo ========================================
echo.
echo ✅ La solucion ha sido implementada
echo ✅ El testing ha sido ejecutado
echo.
echo PROXIMOS PASOS:
echo 1. Verificar que no hay errores 400 en Supabase Dashboard
echo 2. Probar actualizacion de perfil con datos reales
echo 3. Monitorear logs para confirmar la correccion
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
