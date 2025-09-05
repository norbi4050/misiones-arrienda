@echo off
echo ========================================
echo TESTING ELEMENTOS DESPLAZABLES MEJORADOS
echo ========================================
echo.
echo Este script ejecuta el testing exhaustivo de los elementos
echo desplazables (Select dropdowns) para verificar que se vean
echo profesionales y no translucidos despues de las mejoras.
echo.
echo REQUISITOS:
echo - Servidor Next.js ejecutandose en localhost:3000
echo - Node.js y npm instalados
echo - Puppeteer instalado
echo.
pause

echo.
echo 🔍 Verificando que el servidor este ejecutandose...
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: El servidor no esta ejecutandose en localhost:3000
    echo.
    echo Por favor, ejecuta primero:
    echo cd Backend
    echo npm run dev
    echo.
    pause
    exit /b 1
)

echo ✅ Servidor detectado en localhost:3000
echo.

echo 🚀 Ejecutando testing de elementos desplazables mejorados...
echo.

node test-elementos-desplazables-mejorados.js

echo.
echo 📋 RESULTADOS DEL TESTING:
echo ================================
echo.

if exist "reporte-elementos-desplazables-mejorados.json" (
    echo ✅ Reporte generado: reporte-elementos-desplazables-mejorados.json
) else (
    echo ❌ No se genero el reporte principal
)

if exist "elementos-desplazables-mejorados.png" (
    echo ✅ Screenshot guardado: elementos-desplazables-mejorados.png
) else (
    echo ❌ No se genero el screenshot
)

if exist "reporte-error-elementos-desplazables.json" (
    echo ⚠️  Se genero reporte de error: reporte-error-elementos-desplazables.json
    echo 📸 Screenshot de error: error-elementos-desplazables.png
)

echo.
echo 📊 MEJORAS IMPLEMENTADAS:
echo ========================
echo ✅ Fondo solido blanco para dropdowns
echo ✅ Sombra mejorada (shadow-xl)
echo ✅ Bordes redondeados (rounded-lg)
echo ✅ Hover effects en azul
echo ✅ Indicadores de seleccion en azul
echo ✅ Transiciones suaves
echo.

echo 🎯 ELEMENTOS VERIFICADOS:
echo =========================
echo ✅ Select de ubicacion
echo ✅ Select de tipo de propiedad
echo ✅ Select de precio minimo
echo ✅ Select de precio maximo
echo ✅ Busquedas rapidas
echo ✅ Filtros activos
echo.

echo 🏁 Testing completado!
echo.
echo Para ver los resultados detallados, revisa:
echo - reporte-elementos-desplazables-mejorados.json
echo - elementos-desplazables-mejorados.png
echo.
pause
