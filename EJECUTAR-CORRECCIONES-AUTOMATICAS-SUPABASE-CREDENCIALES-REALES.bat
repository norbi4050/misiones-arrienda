@echo off
echo ========================================
echo EJECUTANDO CORRECCIONES AUTOMATICAS
echo SUPABASE CON CREDENCIALES REALES
echo ========================================
echo.
echo Fecha: %date% %time%
echo Proyecto: Misiones Arrienda
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando dependencias de Supabase...
if not exist "node_modules\@supabase\supabase-js" (
    echo Instalando dependencias de Supabase...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo APLICANDO CORRECCIONES AUTOMATICAS
echo ========================================
echo.
echo Este proceso corregira automaticamente:
echo - Politicas RLS (Row Level Security)
echo - Columnas faltantes en tablas
echo - Configuracion de Storage
echo - Autenticacion con contraseñas fuertes
echo - Verificacion de Service Role
echo - Funciones SQL necesarias
echo.

echo Ejecutando correcciones automaticas...
node "SCRIPT-CORRECCION-AUTOMATICA-SUPABASE-CREDENCIALES-REALES.js"

if errorlevel 1 (
    echo.
    echo ========================================
    echo CORRECCIONES COMPLETADAS CON ERRORES
    echo ========================================
    echo.
    echo Algunas correcciones fallaron.
    echo Revisa el reporte para correcciones manuales.
    echo.
    echo PROXIMOS PASOS:
    echo 1. Revisa REPORTE-CORRECCIONES-SUPABASE-AUTOMATICAS-FINAL.json
    echo 2. Aplica correcciones manuales si es necesario
    echo 3. Ejecuta el testing nuevamente para verificar
    echo.
) else (
    echo.
    echo ========================================
    echo CORRECCIONES APLICADAS EXITOSAMENTE
    echo ========================================
    echo.
    echo Todas las correcciones se aplicaron correctamente.
    echo Supabase esta listo para usar.
    echo.
    echo PROXIMOS PASOS:
    echo 1. Ejecuta el testing exhaustivo para verificar
    echo 2. Prueba el registro y login de usuarios
    echo 3. Verifica la carga de imagenes
    echo.
)

echo Reporte guardado en: REPORTE-CORRECCIONES-SUPABASE-AUTOMATICAS-FINAL.json
echo.

echo ========================================
echo COMANDOS UTILES PARA VERIFICAR:
echo ========================================
echo.
echo Para re-ejecutar el testing exhaustivo:
echo   EJECUTAR-TESTING-EXHAUSTIVO-SUPABASE-CON-CREDENCIALES-REALES.bat
echo.
echo Para verificar el estado actual:
echo   node "TESTING-EXHAUSTIVO-SUPABASE-CON-CREDENCIALES-REALES-COMPLETO.js"
echo.

pause
