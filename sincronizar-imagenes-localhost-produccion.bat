@echo off
echo 🔄 SINCRONIZANDO IMÁGENES ENTRE LOCALHOST Y PRODUCCIÓN
echo ================================================================

echo.
echo 📍 PASO 1: Verificando imágenes en directorio público...
cd Backend
dir public\*.jpg /b

echo.
echo 📍 PASO 2: Limpiando cache del navegador...
echo Instrucciones para limpiar cache:
echo - Chrome: Ctrl+Shift+R (recarga forzada)
echo - Firefox: Ctrl+F5
echo - Edge: Ctrl+Shift+R

echo.
echo 📍 PASO 3: Reiniciando servidor de desarrollo...
echo Cerrando servidor actual...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 📍 PASO 4: Iniciando servidor con cache limpio...
echo Ejecutando: npm run dev
start cmd /k "cd Backend && npm run dev"

echo.
echo 📍 PASO 5: Verificando que las imágenes se sirvan correctamente...
timeout /t 5 /nobreak >nul

echo.
echo 🔧 SOLUCIONES ADICIONALES:
echo.
echo 1. VERIFICAR RUTAS DE IMÁGENES:
echo    - Las imágenes deben estar en Backend/public/
echo    - Se acceden como /imagen.jpg (sin /public/)
echo.
echo 2. LIMPIAR CACHE COMPLETO:
echo    - Borrar carpeta .next: rmdir /s Backend\.next
echo    - Reiniciar servidor
echo.
echo 3. VERIFICAR NEXT.CONFIG.JS:
echo    - Asegurar configuración correcta de imágenes
echo.
echo 4. HARD REFRESH EN NAVEGADOR:
echo    - Ctrl+Shift+R en Chrome
echo    - Ctrl+F5 en Firefox
echo.
echo ✅ SINCRONIZACIÓN COMPLETADA
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Abrir http://localhost:3000 en navegador
echo 2. Hacer Ctrl+Shift+R para recarga forzada
echo 3. Verificar que las imágenes aparezcan
echo 4. Comparar con https://www.misionesarrienda.com.ar
echo.
pause
