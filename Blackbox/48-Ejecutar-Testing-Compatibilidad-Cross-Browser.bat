@echo off
echo ========================================
echo 48. EJECUTAR TESTING COMPATIBILIDAD CROSS-BROWSER
echo ========================================
echo.
echo Este test simulara diferentes navegadores y versiones:
echo.
echo NAVEGADORES A PROBAR:
echo - Google Chrome (Latest, 120, 119, 118)
echo - Mozilla Firefox (Latest, 121, 120, 119)
echo - Safari (17, 16, 15, 14)
echo - Microsoft Edge (Latest, 120, 119, 118)
echo - Mobile Browsers (iOS Safari, Chrome Mobile, Samsung Internet, Opera Mobile)
echo.
echo PAGINAS CRITICAS:
echo - Homepage, Properties, Property Detail, Login, Register
echo - Publish Property, Community, Dashboard
echo.
pause

cd /d "%~dp0.."

echo Verificando que el servidor este corriendo...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando testing de compatibilidad cross-browser...
echo NOTA: Este proceso puede tomar 5-8 minutos
echo.

node "Blackbox/47-Testing-Compatibilidad-Cross-Browser.js"

echo.
echo ========================================
echo TESTING DE COMPATIBILIDAD COMPLETADO
echo ========================================
echo.
echo Revisa el archivo:
echo - Blackbox/48-Reporte-Testing-Compatibilidad-Cross-Browser.json
echo.
pause
