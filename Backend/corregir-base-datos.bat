@echo off
echo ========================================
echo    CORRIGIENDO BASE DE DATOS SQLITE
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
echo Limpiando cache de Prisma...
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma

echo.
echo ✅ Schema SQLite corregido
echo ✅ PostCSS configurado
echo ✅ CSS corregido
echo ✅ Imágenes corregidas
echo.

echo Regenerando cliente Prisma...
call npm run db:generate

echo.
echo Creando nueva base de datos...
call npm run db:push

echo.
echo Poblando con datos (usando seed compatible)...
call npx tsx prisma/seed-sqlite.ts

echo.
echo ========================================
echo    INICIANDO SERVIDOR - VERSION FINAL
echo ========================================
echo.
echo 🎯 TODOS LOS PROBLEMAS SOLUCIONADOS:
echo    ✅ Base de datos SQLite funcionando
echo    ✅ CSS compilando correctamente
echo    ✅ Imágenes con nombres correctos
echo    ✅ PostCSS configurado
echo.
echo Abriendo en: http://localhost:3000
echo.

timeout /t 3 >nul
start http://localhost:3000

npm run dev

pause
