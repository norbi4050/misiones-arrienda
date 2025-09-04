te vo@echo off
echo ================================================================
echo EJECUTANDO SOLUCION AUTOMATICA PROBLEMAS BACKEND/API
echo ================================================================
echo.
echo Fecha: %date% %time%
echo Script: 179-Solucion-Automatica-Problemas-Backend-API.js
echo.
echo ================================================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente
echo.

REM Ejecutar el script de solución automática
echo 🚀 Iniciando solución automática de problemas...
echo.
echo PASOS QUE SE EJECUTARÁN:
echo 1. Verificar prerequisitos del sistema
echo 2. Comprobar conectividad de red
echo 3. Instalar dependencias del proyecto
echo 4. Verificar variables de entorno
echo 5. Crear archivo .env si es necesario
echo 6. Iniciar servidor backend
echo 7. Realizar verificación final
echo.

set /p CONFIRM="¿Desea continuar con la solución automática? (S/N): "
if /i "%CONFIRM%" neq "S" (
    echo Operación cancelada por el usuario.
    pause
    exit /b 0
)

echo.
echo 🔧 Ejecutando solución automática...
echo.

node "179-Solucion-Automatica-Problemas-Backend-API.js"

REM Capturar el código de salida
set EXIT_CODE=%errorlevel%

echo.
echo ================================================================
echo SOLUCION AUTOMATICA COMPLETADA
echo ================================================================
echo.

if %EXIT_CODE% equ 0 (
    echo ✅ RESULTADO: SOLUCION EXITOSA
    echo 🎉 Los problemas han sido resueltos automáticamente
    echo.
    echo 📋 PRÓXIMOS PASOS:
    echo 1. Re-ejecutar la verificación del backend/API
    echo 2. Comprobar que el servidor esté funcionando en http://localhost:3000
    echo 3. Verificar que Supabase sea accesible
    echo.
    echo 🔄 Para verificar los cambios, ejecute:
    echo    177-Ejecutar-Verificacion-Backend-API-Con-Credenciales-Reales.bat
) else (
    echo ❌ RESULTADO: ALGUNOS PROBLEMAS PERSISTEN
    echo 🔧 Revisa el reporte generado para más detalles
    echo.
    echo 📋 ACCIONES RECOMENDADAS:
    echo 1. Revisar los logs mostrados arriba
    echo 2. Verificar manualmente los pasos que fallaron
    echo 3. Consultar el reporte JSON generado
    echo 4. Considerar intervención manual
)

echo.
echo 📁 Archivos generados:
echo - Reporte JSON: 180-REPORTE-SOLUCION-AUTOMATICA-*.json
echo - Logs de ejecución: Mostrados en pantalla
echo.
echo ================================================================
echo.

REM Preguntar si desea ejecutar la verificación inmediatamente
if %EXIT_CODE% equ 0 (
    echo.
    set /p VERIFY="¿Desea ejecutar la verificación del backend ahora? (S/N): "
    if /i "!VERIFY!" equ "S" (
        echo.
        echo 🔍 Ejecutando verificación del backend...
        echo.
        call "177-Ejecutar-Verificacion-Backend-API-Con-Credenciales-Reales.bat"
    )
)

echo.
echo Presione cualquier tecla para continuar...
pause >nul
exit /b %EXIT_CODE%
