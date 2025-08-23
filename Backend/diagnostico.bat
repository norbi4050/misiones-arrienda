@echo off
echo ========================================
echo    DIAGNOSTICO MISIONES ARRIENDA
echo ========================================
echo.

echo Verificando ubicacion actual:
echo %CD%
echo.

echo Verificando Node.js:
node --version
echo.

echo Verificando npm:
npm --version
echo.

echo Verificando package.json:
if exist package.json (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json NO encontrado
    pause
    exit /b 1
)
echo.

echo Verificando node_modules:
if exist node_modules (
    echo ✅ node_modules encontrado
) else (
    echo ❌ node_modules NO encontrado - ejecutando npm install...
    npm install
)
echo.

echo Verificando base de datos:
if exist dev.db (
    echo ✅ Base de datos SQLite encontrada
) else (
    echo ❌ Base de datos NO encontrada - configurando...
    npm run db:generate
    npm run db:push
    npm run db:seed
)
echo.

echo Verificando puerto 3000:
netstat -ano | findstr :3000
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ Puerto 3000 ya está en uso
) else (
    echo ✅ Puerto 3000 disponible
)
echo.

echo Intentando iniciar servidor...
echo Presiona Ctrl+C para detener
echo.
npm run dev

pause
