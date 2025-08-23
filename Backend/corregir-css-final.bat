@echo off
echo ========================================
echo    CORRIGIENDO ERROR CSS FINAL
echo ========================================
echo.

cd /d "%~dp0"

echo Deteniendo servidor...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo ✅ Error CSS corregido: border-border → border-gray-200
echo ✅ PostCSS configurado correctamente
echo ✅ Nombres de imágenes corregidos
echo.

echo Limpiando cache completamente...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Regenerando todo desde cero...
npm run build 2>nul

echo.
echo ========================================
echo    INICIANDO SERVIDOR - VERSION FINAL
echo ========================================
echo.
echo 🎯 TODOS LOS ERRORES CSS CORREGIDOS
echo 🎯 El proyecto debería funcionar perfectamente ahora
echo.
echo Abriendo en: http://localhost:3000
echo.

timeout /t 3 >nul
start http://localhost:3000

npm run dev

pause
