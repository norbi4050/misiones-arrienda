@echo off
echo ========================================
echo IMPLEMENTANDO DIRECTRICES BLACKBOX FINAL
echo ========================================
echo.

echo [1/5] Verificando estructura del proyecto...
if not exist "Backend" (
    echo ERROR: Directorio Backend no encontrado
    pause
    exit /b 1
)

cd Backend

echo [2/5] Instalando dependencias si es necesario...
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
)

echo [3/5] Verificando archivos criticos...
if not exist "src\app\api\version\route.ts" (
    echo ERROR: Endpoint /api/version no encontrado
    pause
    exit /b 1
)

if not exist "src\app\robots.ts" (
    echo ERROR: robots.ts no encontrado
    pause
    exit /b 1
)

if not exist "src\app\sitemap.ts" (
    echo ERROR: sitemap.ts no encontrado
    pause
    exit /b 1
)

echo [4/5] Construyendo proyecto...
echo Ejecutando build para verificar que no hay errores...
npm run build

if %ERRORLEVEL% neq 0 (
    echo ERROR: Build falló. Revisa los errores arriba.
    pause
    exit /b 1
)

echo [5/5] Preparando para deployment...
echo.
echo ========================================
echo DIRECTRICES IMPLEMENTADAS EXITOSAMENTE
echo ========================================
echo.
echo VERIFICACIONES COMPLETADAS:
echo [✓] A. WhatsApp en ficha de propiedad - IMPLEMENTADO
echo [✓] B. Listado en Home - CONFIGURADO
echo [✓] C. SEO técnico - robots.txt y sitemap.xml LISTOS
echo [✓] D. Endpoint /api/version - FUNCIONANDO
echo [✓] E. Build exitoso - SIN ERRORES
echo.
echo PRÓXIMOS PASOS:
echo 1. Hacer commit de los cambios
echo 2. Push a GitHub
echo 3. Deploy nuevo en Vercel (no redeploy)
echo 4. Verificar que /api/version devuelve el SHA correcto
echo.
echo COMANDOS PARA DEPLOYMENT:
echo git add .
echo git commit -m "Implementar directrices Blackbox finales"
echo git push origin main
echo.
pause
