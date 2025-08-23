@echo off
echo ========================================
echo    INICIANDO MISIONES ARRIENDA
echo ========================================
echo.

echo Navegando a la carpeta Backend...
cd /d "%~dp0"

echo Ubicacion actual: %CD%
echo.

echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    npm install
    echo.
)

echo Configurando base de datos...
npm run db:generate
npm run db:push
npm run db:seed
echo.

echo ========================================
echo INICIANDO SERVIDOR EN PUERTO 3000
echo ========================================
echo.
echo Si ves este mensaje, abre tu navegador en:
echo http://localhost:3000
echo.
echo Para detener el servidor, presiona Ctrl+C
echo.

start "" "http://localhost:3000"
npm run dev

echo.
echo El servidor se ha detenido.
pause
