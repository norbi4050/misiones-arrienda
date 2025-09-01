@echo off
echo ===============================================
echo EJECUTANDO AUDITORIA COMPLETA: PROYECTO VS SUPABASE
echo Fecha: %date% %time%
echo ===============================================
echo.

echo [INFO] Iniciando auditoria exhaustiva de alineacion...
echo [INFO] Verificando dependencias necesarias...

REM Verificar si Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado. Por favor instala Node.js primero.
    pause
    exit /b 1
)

REM Verificar si npm esta disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no esta disponible. Por favor verifica la instalacion de Node.js.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js y npm detectados correctamente.
echo.

echo [INFO] Instalando dependencias necesarias...
cd /d "%~dp0..\Backend"

REM Instalar pg si no esta instalado
npm list pg >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando driver PostgreSQL (pg)...
    npm install pg
    if errorlevel 1 (
        echo [ERROR] Error instalando dependencia pg
        pause
        exit /b 1
    )
)

echo [SUCCESS] Dependencias verificadas.
echo.

echo [INFO] Ejecutando auditoria completa...
echo [INFO] Esto puede tomar varios minutos...
echo.

REM Cambiar al directorio de Blackbox y ejecutar la auditoria
cd /d "%~dp0"
node "75-Auditoria-Completa-Proyecto-Vs-Supabase-Alineacion-Total.js"

if errorlevel 1 (
    echo.
    echo [ERROR] La auditoria termino con errores.
    echo [INFO] Revisa los logs anteriores para mas detalles.
) else (
    echo.
    echo [SUCCESS] ¡Auditoria completada exitosamente!
    echo.
    echo ===============================================
    echo REPORTES GENERADOS:
    echo ===============================================
    echo 📄 Reporte Completo (JSON): 76-Reporte-Auditoria-Completa-Proyecto-Vs-Supabase-Final.json
    echo 📋 Reporte Ejecutivo (MD): 77-Reporte-Ejecutivo-Auditoria-Alineacion-Final.md
    echo.
    echo [INFO] Los reportes contienen:
    echo - Comparacion detallada de esquemas Prisma vs Supabase
    echo - Analisis de politicas RLS y seguridad
    echo - Verificacion de variables de entorno
    echo - Auditoria de APIs y endpoints
    echo - Recomendaciones prioritarias
    echo - Plan de accion con proximos pasos
    echo.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
