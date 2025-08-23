@echo off
echo ========================================
echo    TESTING COMPLETO MISIONES ARRIENDA
echo ========================================
echo.

echo [1/10] Verificando ubicacion...
echo Ubicacion actual: %CD%
echo.

echo [2/10] Verificando Node.js y npm...
node --version
npm --version
echo.

echo [3/10] Verificando archivos esenciales...
if exist package.json (echo ✅ package.json) else (echo ❌ package.json FALTA)
if exist next.config.js (echo ✅ next.config.js) else (echo ❌ next.config.js FALTA)
if exist .env.local (echo ✅ .env.local) else (echo ❌ .env.local FALTA)
if exist prisma\schema.prisma (echo ✅ schema.prisma) else (echo ❌ schema.prisma FALTA)
echo.

echo [4/10] Verificando dependencias...
if exist node_modules (echo ✅ node_modules existe) else (
    echo ❌ node_modules NO existe - instalando...
    npm install
)
echo.

echo [5/10] Verificando base de datos...
if exist dev.db (echo ✅ Base de datos SQLite existe) else (
    echo ❌ Base de datos NO existe - creando...
    npm run db:generate
    npm run db:push
    npm run db:seed
)
echo.

echo [6/10] Verificando build...
echo Intentando build del proyecto...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build exitoso
) else (
    echo ❌ Build falló - hay errores en el código
    pause
    exit /b 1
)
echo.

echo [7/10] Verificando puerto 3000...
netstat -ano | findstr :3000
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ Puerto 3000 ya está en uso - matando procesos...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Puerto 3000 disponible
)
echo.

echo [8/10] Iniciando servidor de desarrollo...
echo Iniciando npm run dev...
echo Si ves "Ready - started server", el servidor está funcionando
echo.
start /B npm run dev
timeout /t 10 /nobreak >nul

echo [9/10] Verificando que el servidor responde...
timeout /t 5 /nobreak >nul
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 10; Write-Host '✅ Servidor responde - Status:' $response.StatusCode } catch { Write-Host '❌ Servidor no responde:' $_.Exception.Message }"
echo.

echo [10/10] Testing API endpoints...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/properties' -Method Get -TimeoutSec 10; Write-Host '✅ API Properties funciona - Propiedades encontradas:' $response.Count } catch { Write-Host '❌ API Properties falla:' $_.Exception.Message }"
echo.

echo ========================================
echo    TESTING COMPLETADO
echo ========================================
echo.
echo Si todo está ✅, abre tu navegador en: http://localhost:3000
echo Para detener el servidor, presiona Ctrl+C
echo.
pause
