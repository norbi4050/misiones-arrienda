@echo off
echo =====================================================
echo EJECUTANDO CORRECCION ERROR UUID EN TABLA USERS
echo =====================================================
echo.
echo Este script corregira el error critico:
echo "operator does not exist: uuid = text"
echo.
echo PROBLEMA DETECTADO:
echo - La tabla users tiene columna id como TEXT
echo - Deberia ser UUID para compatibilidad con auth.users
echo - Esto causa errores en JOINs y endpoints de perfil
echo.
echo SOLUCION:
echo 1. Crear tabla temporal con estructura UUID correcta
echo 2. Migrar datos existentes (si los hay)
echo 3. Reemplazar tabla original
echo 4. Recrear indices, triggers y politicas RLS
echo 5. Verificar que la correccion funcione
echo.
pause
echo.
echo Ejecutando script de correccion...
node ejecutar-correccion-error-uuid-users-table.js
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ CORRECCION COMPLETADA EXITOSAMENTE
    echo.
    echo PROXIMOS PASOS:
    echo 1. Probar el endpoint /api/users/profile
    echo 2. Verificar que el registro de usuarios funcione
    echo 3. Confirmar que no hay mas errores uuid = text
    echo.
    echo El problema del perfil de usuario deberia estar resuelto.
) else (
    echo ❌ LA CORRECCION FALLO
    echo.
    echo Revisa los errores anteriores y:
    echo 1. Verifica las variables de entorno de Supabase
    echo 2. Ejecuta manualmente el SQL desde SOLUCION-DEFINITIVA-ERROR-TIPO-UUID-USERS-TABLE.sql
    echo 3. Contacta soporte si persiste el problema
)
echo.
pause
