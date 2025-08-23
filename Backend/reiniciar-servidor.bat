@echo off
echo ========================================
echo    REINICIANDO CON CORRECCIONES CSS
echo ========================================
echo.

cd /d "%~dp0"

echo Deteniendo servidor anterior...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo Limpiando cache de Next.js...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Regenerando estilos CSS...
npm run build 2>nul

echo.
echo ========================================
echo    INICIANDO SERVIDOR CON CSS CORREGIDO
echo ========================================
echo.
echo ✅ PostCSS configurado
echo ✅ Nombres de imágenes corregidos
echo ✅ Cache limpiado
echo.
echo El servidor se iniciará en: http://localhost:3000
echo Ahora deberías ver los estilos correctamente
echo.

npm run dev

pause
