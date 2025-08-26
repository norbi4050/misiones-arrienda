@echo off
echo ========================================
echo SOLUCION: Cambios no visibles en pagina web
echo ========================================
echo.

echo 1. Limpiando cache de Next.js...
cd Backend
rmdir /s /q .next 2>nul
echo Cache .next eliminado

echo.
echo 2. Limpiando node_modules cache...
npm cache clean --force
echo Cache npm limpiado

echo.
echo 3. Eliminando archivos temporales...
del /q /s *.tmp 2>nul
del /q /s .DS_Store 2>nul
echo Archivos temporales eliminados

echo.
echo 4. Reinstalando dependencias...
npm install
echo Dependencias reinstaladas

echo.
echo 5. Compilando proyecto...
npm run build
echo Proyecto compilado

echo.
echo 6. Iniciando servidor de desarrollo...
echo IMPORTANTE: Abre http://localhost:3000 en modo incognito
echo Presiona Ctrl+F5 para forzar recarga sin cache
echo.
start http://localhost:3000
npm run dev

pause
