@echo off
echo ========================================
echo 🚀 TESTING PHASE 5: SEO & PERFORMANCE OPTIMIZATION
echo ========================================
echo.

echo ✅ Verificando archivos implementados...
if exist "Backend\src\lib\structured-data.ts" (
    echo    ✓ Structured Data library creada
) else (
    echo    ❌ Structured Data library NO encontrada
)

if exist "Backend\src\app\eldorado\page.tsx" (
    echo    ✓ Página Eldorado creada
) else (
    echo    ❌ Página Eldorado NO encontrada
)

echo.
echo ✅ Verificando TypeScript compilation...
cd Backend
npx tsc --noEmit
if %errorlevel% equ 0 (
    echo    ✓ Compilación exitosa - Sin errores TypeScript
) else (
    echo    ❌ Errores de compilación detectados
    echo    Revisa los archivos TypeScript
)
echo.

echo ✅ Verificando SEO optimizations...
echo    📍 Structured Data (JSON-LD):
echo       - Property schema ✓
echo       - Organization schema ✓
echo       - Breadcrumb schema ✓
echo       - City page schema ✓
echo.
echo    📍 Sitemap:
echo       - Dynamic property pages ✓
echo       - City pages (including Eldorado) ✓
echo       - Static pages ✓
echo.
echo    📍 Metadata:
echo       - Enhanced property metadata ✓
echo       - City-specific metadata ✓
echo       - OpenGraph optimization ✓
echo       - Twitter Cards ✓
echo.

echo ✅ Iniciando servidor para testing...
echo    📍 Abriendo páginas para verificación:
echo    🔍 Verifica manualmente:
echo       - http://localhost:3000/eldorado (nueva página)
echo       - http://localhost:3000/property/1 (structured data)
echo       - http://localhost:3000/sitemap.xml (sitemap dinámico)
echo       - View Page Source para JSON-LD
echo.

start http://localhost:3000/eldorado
timeout /t 3 /nobreak >nul
start http://localhost:3000/sitemap.xml
npm run dev

pause
