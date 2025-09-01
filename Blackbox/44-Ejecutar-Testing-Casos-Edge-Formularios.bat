@echo off
echo ========================================
echo 44. EJECUTAR TESTING CASOS EDGE FORMULARIOS
echo ========================================
echo.
echo Iniciando testing exhaustivo de casos edge en formularios...
echo.

cd /d "%~dp0.."

echo Verificando que el servidor este corriendo...
timeout /t 2 /nobreak >nul

echo.
echo Ejecutando testing de casos edge...
node "Blackbox/43-Testing-Exhaustivo-Casos-Edge-Formularios.js"

echo.
echo ========================================
echo TESTING DE CASOS EDGE COMPLETADO
echo ========================================
echo.
echo Revisa el archivo:
echo - Blackbox/44-Reporte-Testing-Casos-Edge-Formularios.json
echo.
pause
