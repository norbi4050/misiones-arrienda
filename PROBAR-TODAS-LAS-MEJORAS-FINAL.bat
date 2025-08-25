@echo off
echo ========================================
echo   TESTING COMPLETO - MEJORAS SEO FINAL
echo ========================================
echo.

echo 🔍 VERIFICANDO TODAS LAS MEJORAS IMPLEMENTADAS...
echo.

echo ✅ 1. SERVER-SIDE RENDERING (SSR)
if exist "Backend\src\app\page.tsx" (
    echo    ✓ Página principal con SSR - ENCONTRADO
) else (
    echo    ✗ Página principal - NO ENCONTRADO
)

echo.
echo ✅ 2. PÁGINAS DE DETALLE OPTIMIZADAS
if exist "Backend\src\app\property\[id]\page.tsx" (
    echo    ✓ Página de detalle SSR - ENCONTRADO
) else (
    echo    ✗ Página de detalle SSR - NO ENCONTRADO
)

if exist "Backend\src\app\property\[id]\property-detail-client.tsx" (
    echo    ✓ Componente cliente separado - ENCONTRADO
) else (
    echo    ✗ Componente cliente - NO ENCONTRADO
)

echo.
echo ✅ 3. PÁGINAS POR CIUDAD (SEO LOCAL)
if exist "Backend\src\app\posadas\page.tsx" (
    echo    ✓ Página Posadas - ENCONTRADO
) else (
    echo    ✗ Página Posadas - NO ENCONTRADO
)

if exist "Backend\src\app\obera\page.tsx" (
    echo    ✓ Página Oberá - ENCONTRADO
) else (
    echo    ✗ Página Oberá - NO ENCONTRADO
)

if exist "Backend\src\app\puerto-iguazu\page.tsx" (
    echo    ✓ Página Puerto Iguazú - ENCONTRADO
) else (
    echo    ✗ Página Puerto Iguazú - NO ENCONTRADO
)

echo.
echo ✅ 4. SEO TÉCNICO
if exist "Backend\src\app\sitemap.ts" (
    echo    ✓ Sitemap dinámico - ENCONTRADO
) else (
    echo    ✗ Sitemap dinámico - NO ENCONTRADO
)

if exist "Backend\src\app\robots.ts" (
    echo    ✓ Robots.txt - ENCONTRADO
) else (
    echo    ✗ Robots.txt - NO ENCONTRADO
)

echo.
echo ✅ 5. PROPIEDADES DE EJEMPLO
if exist "Backend\src\lib\api.ts" (
    echo    ✓ API con propiedades de ejemplo - ENCONTRADO
) else (
    echo    ✗ API con propiedades - NO ENCONTRADO
)

echo.
echo 🚀 INICIANDO SERVIDOR PARA TESTING COMPLETO...
echo.

cd Backend
echo Instalando dependencias...
call npm install --silent

echo.
echo 🌐 Iniciando servidor de desarrollo...
echo.
echo ==========================================
echo           GUÍA DE TESTING COMPLETO
echo ==========================================
echo.
echo 📋 TESTING CHECKLIST:
echo.
echo ✅ PÁGINA PRINCIPAL (http://localhost:3000)
echo    □ Verificar que se muestren 6 propiedades
echo    □ Comprobar metadatos en código fuente (Ctrl+U)
echo    □ Buscar JSON-LD structured data
echo.
echo ✅ PÁGINAS POR CIUDAD:
echo    □ http://localhost:3000/posadas
echo    □ http://localhost:3000/obera  
echo    □ http://localhost:3000/puerto-iguazu
echo    □ Verificar contenido específico por ciudad
echo.
echo ✅ PÁGINAS DE DETALLE:
echo    □ Hacer clic en cualquier propiedad
echo    □ Verificar galería de imágenes
echo    □ Comprobar metadatos únicos
echo    □ Probar botones WhatsApp
echo.
echo ✅ SEO TÉCNICO:
echo    □ http://localhost:3000/sitemap.xml
echo    □ http://localhost:3000/robots.txt
echo.
echo ✅ RESPONSIVE:
echo    □ Probar en móvil (F12 → Device Mode)
echo    □ Verificar que todo se vea bien
echo.
echo ==========================================
echo.
echo ⚠️  IMPORTANTE: 
echo    - Deja esta ventana abierta mientras pruebas
echo    - Usa Ctrl+U para ver código fuente
echo    - Busca "application/ld+json" para JSON-LD
echo.

start http://localhost:3000
call npm run dev

pause
