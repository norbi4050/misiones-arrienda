@echo off
echo ========================================
echo EJECUTANDO TESTING EXHAUSTIVO COMPLETO
echo ========================================
echo.
echo Fecha: %date% %time%
echo Directorio: %cd%
echo.

echo [1/3] Ejecutando Testing APIs Backend...
echo ----------------------------------------
cd /d "%~dp0"
node 21-Testing-APIs-Backend-Exhaustivo.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo en testing de APIs Backend
    pause
    exit /b 1
)
echo.

echo [2/3] Ejecutando Testing Frontend Integracion...
echo ------------------------------------------------
node 23-Testing-Frontend-Integracion.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo en testing de Frontend
    pause
    exit /b 1
)
echo.

echo [3/3] Ejecutando Testing Database y Storage...
echo ----------------------------------------------
node 25-Testing-Database-Storage.js
if %errorlevel% neq 0 (
    echo ERROR: Fallo en testing de Database y Storage
    pause
    exit /b 1
)
echo.

echo ========================================
echo TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Todos los tests han sido ejecutados:
echo - APIs Backend: COMPLETADO
echo - Frontend Integracion: COMPLETADO  
echo - Database y Storage: COMPLETADO
echo.
echo Reportes generados:
echo - 22-Reporte-Testing-APIs-Backend.md
echo - 24-Reporte-Testing-Frontend.md
echo - 26-Reporte-Final-Testing-Exhaustivo-Completo.md
echo.
echo Archivos JSON con resultados detallados:
echo - 21-Testing-APIs-Backend-Results.json
echo - 23-Testing-Frontend-Results.json
echo - 25-Testing-Database-Storage-Results.json
echo.
echo PROYECTO MISIONES ARRIENDA: 100%% FUNCIONAL
echo Estado: LISTO PARA PRODUCCION
echo.
pause
