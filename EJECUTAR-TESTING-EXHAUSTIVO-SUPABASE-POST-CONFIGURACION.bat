@echo off
echo ================================================================
echo 🚀 EJECUTANDO TESTING EXHAUSTIVO DE SUPABASE POST-CONFIGURACION
echo ================================================================
echo.
echo Este script ejecutara un testing completo para verificar que
echo la configuracion de Supabase este funcionando perfectamente.
echo.
echo Areas que se van a probar:
echo - Archivos de configuracion de Supabase
echo - Variables de entorno
echo - Estructura del cliente y servidor
echo - Middleware de autenticacion
echo - Endpoints API
echo - Componentes UI
echo - Hooks de autenticacion
echo - Tipos TypeScript
echo - Dependencias
echo - Archivos SQL
echo.
echo ================================================================
echo.

:: Verificar si Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

:: Ejecutar el testing
echo 🧪 Iniciando testing exhaustivo...
echo.
node TESTING-EXHAUSTIVO-SUPABASE-POST-CONFIGURACION.js

:: Verificar si se genero el reporte
if exist "REPORTE-TESTING-SUPABASE-POST-CONFIGURACION.json" (
    echo.
    echo ================================================================
    echo ✅ TESTING COMPLETADO EXITOSAMENTE
    echo ================================================================
    echo.
    echo 📄 Reporte generado: REPORTE-TESTING-SUPABASE-POST-CONFIGURACION.json
    echo.
    echo Para ver el reporte detallado, abre el archivo JSON generado.
    echo.
) else (
    echo.
    echo ================================================================
    echo ❌ ERROR EN EL TESTING
    echo ================================================================
    echo.
    echo No se pudo generar el reporte. Revisa los errores arriba.
    echo.
)

echo Presiona cualquier tecla para continuar...
pause >nul
