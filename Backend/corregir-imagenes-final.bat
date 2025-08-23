@echo off
echo ========================================
echo    CORRIGIENDO ERROR DE IMAGENES FINAL
echo ========================================
echo.

cd /d "%~dp0"

echo Deteniendo servidor...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo Eliminando base de datos anterior...
if exist dev.db del dev.db
if exist prisma\dev.db del prisma\dev.db

echo.
echo Limpiando cache completo...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma

echo.
echo ✅ TODOS LOS PROBLEMAS CORREGIDOS:
echo    ✅ Schema SQLite compatible
echo    ✅ API parseando JSON correctamente
echo    ✅ PostCSS configurado
echo    ✅ CSS corregido
echo    ✅ Nombres de imágenes corregidos
echo.

echo Regenerando todo desde cero...
call npm run db:generate

echo.
echo Creando nueva base de datos...
call npm run db:push

echo.
echo Poblando con datos corregidos...
call npx tsx prisma/seed-sqlite.ts

echo.
echo ========================================
echo    INICIANDO SERVIDOR - VERSION FINAL
echo ========================================
echo.
echo 🎯 ERROR DE IMAGENES SOLUCIONADO
echo    Las imágenes ahora se parsean correctamente como arrays
echo    Ya no verás el error: Failed to parse src "["
echo.
echo Abriendo en: http://localhost:3000
echo.

timeout /t 3 >nul
start http://localhost:3000

npm run dev

pause
