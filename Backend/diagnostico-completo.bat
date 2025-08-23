@echo off
echo ========================================
echo   DIAGNÓSTICO COMPLETO - MISIONES ARRIENDA
echo ========================================
echo.
echo Verificando estado del proyecto...
echo.

echo 1. Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Instalar Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado correctamente
echo.

echo 2. Verificando npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)
echo ✅ npm disponible
echo.

echo 3. Verificando package.json...
if not exist package.json (
    echo ❌ ERROR: package.json no encontrado
    echo Asegúrate de estar en la carpeta Backend
    pause
    exit /b 1
)
echo ✅ package.json encontrado
echo.

echo 4. Verificando node_modules...
if not exist node_modules (
    echo ⚠️  node_modules no encontrado. Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación de dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ node_modules existe
)
echo.

echo 5. Verificando base de datos...
if not exist prisma\dev.db (
    echo ⚠️  Base de datos no encontrada. Creando...
    npx prisma db push --force-reset
    npx tsx prisma/seed-sqlite.ts
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la creación de la base de datos
        pause
        exit /b 1
    )
    echo ✅ Base de datos creada y poblada
) else (
    echo ✅ Base de datos existe
)
echo.

echo 6. Verificando archivos críticos...
if not exist src\app\page.tsx (
    echo ❌ ERROR: Archivo principal no encontrado
    pause
    exit /b 1
)
if not exist src\app\publicar\page.tsx (
    echo ❌ ERROR: Página /publicar no encontrada
    pause
    exit /b 1
)
echo ✅ Archivos críticos presentes
echo.

echo ========================================
echo   DIAGNÓSTICO COMPLETADO
echo ========================================
echo.
echo Todo parece estar en orden. Iniciando servidor...
echo.
echo El navegador se abrirá en http://localhost:3000
echo Para detener el servidor presiona Ctrl+C
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000
npm run dev
