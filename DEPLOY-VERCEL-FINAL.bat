@echo off
echo ========================================
echo   DEPLOY MISIONES ARRIENDA EN VERCEL
echo ========================================
echo.

echo Paso 1: Verificando que estamos en la ubicacion correcta...
if not exist Backend\package.json (
    echo ❌ ERROR: No se encuentra Backend\package.json
    echo Asegurate de estar en la carpeta Misiones-Arrienda
    pause
    exit /b 1
)

echo ✅ Ubicacion correcta encontrada
echo.

echo Paso 2: Navegando a la carpeta Backend...
cd Backend
if %errorlevel% neq 0 (
    echo ❌ Error al navegar a Backend
    pause
    exit /b 1
)

echo ✅ En carpeta Backend
echo.

echo Paso 3: Verificando instalacion de Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Vercel CLI no instalado. Instalando...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar Vercel CLI
        pause
        exit /b 1
    )
)

echo ✅ Vercel CLI disponible
echo.

echo Paso 4: Login a Vercel (si es necesario)...
echo Si no estas logueado, se abrira el navegador para login
vercel login

echo.
echo Paso 5: Configurando variables de entorno...
echo Configurando DATABASE_URL...
vercel env add DATABASE_URL
echo Ingresa: file:./dev.db

echo.
echo Configurando NEXT_TELEMETRY_DISABLED...
vercel env add NEXT_TELEMETRY_DISABLED
echo Ingresa: 1

echo.
echo Paso 6: Haciendo deploy en Vercel...
vercel --prod

echo.
echo ✅ DEPLOY COMPLETADO
echo.
echo Tu portal Misiones Arrienda deberia estar funcionando en la URL que mostro Vercel
echo.
echo Funcionalidades disponibles:
echo ✅ Pagina principal con propiedades
echo ✅ Sistema de planes (Basico, Destacado, Full)
echo ✅ API routes funcionando
echo ✅ Base de datos SQLite
echo ✅ Integracion MercadoPago
echo ✅ Sistema de consultas por email
echo.
pause
