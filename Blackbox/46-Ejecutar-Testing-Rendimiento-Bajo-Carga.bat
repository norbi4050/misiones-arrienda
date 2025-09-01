@echo off
echo ========================================
echo 46. EJECUTAR TESTING RENDIMIENTO BAJO CARGA
echo ========================================
echo.
echo ADVERTENCIA: Este test puede tomar varios minutos
echo y generara carga significativa en el servidor.
echo.
echo Configuraciones de carga a probar:
echo - Carga Ligera: 5 usuarios concurrentes, 50 requests
echo - Carga Media: 15 usuarios concurrentes, 150 requests  
echo - Carga Pesada: 30 usuarios concurrentes, 300 requests
echo - Pico de Carga: 50 usuarios concurrentes, 100 requests
echo.
pause

cd /d "%~dp0.."

echo Verificando que el servidor este corriendo...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando testing de rendimiento bajo carga...
echo NOTA: Este proceso puede tomar 10-15 minutos
echo.

node "Blackbox/45-Testing-Rendimiento-Bajo-Carga.js"

echo.
echo ========================================
echo TESTING DE RENDIMIENTO COMPLETADO
echo ========================================
echo.
echo Revisa el archivo:
echo - Blackbox/46-Reporte-Testing-Rendimiento-Bajo-Carga.json
echo.
pause
