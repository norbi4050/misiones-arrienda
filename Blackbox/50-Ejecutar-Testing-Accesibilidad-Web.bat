@echo off
echo ========================================
echo 50. EJECUTAR TESTING ACCESIBILIDAD WEB
echo ========================================
echo.
echo Este test evaluara la accesibilidad segun estandares WCAG 2.1:
echo.
echo NIVELES DE CUMPLIMIENTO:
echo - Nivel A (Basico): Requisitos minimos de accesibilidad
echo - Nivel AA (Estandar): Nivel recomendado para sitios web
echo - Nivel AAA (Avanzado): Nivel mas alto de accesibilidad
echo.
echo PAGINAS A EVALUAR:
echo - Homepage, Properties, Property Detail, Login, Register
echo - Publish Property, Community, Dashboard
echo.
echo CRITERIOS EVALUADOS:
echo - Texto alternativo en imagenes
echo - Etiquetas en formularios
echo - Estructura de encabezados
echo - Navegacion por teclado
echo - Contraste de colores
echo - HTML semantico
echo - Y muchos mas...
echo.
pause

cd /d "%~dp0.."

echo Verificando que el servidor este corriendo...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando testing de accesibilidad web...
echo NOTA: Este proceso puede tomar 3-5 minutos
echo.

node "Blackbox/49-Testing-Accesibilidad-Web.js"

echo.
echo ========================================
echo TESTING DE ACCESIBILIDAD COMPLETADO
echo ========================================
echo.
echo Revisa el archivo:
echo - Blackbox/50-Reporte-Testing-Accesibilidad-Web.json
echo.
pause
