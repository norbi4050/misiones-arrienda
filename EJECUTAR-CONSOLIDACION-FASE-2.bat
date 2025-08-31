@echo off
echo ========================================
echo FASE 2: CONSOLIDACION DE CODIGO
echo ========================================
echo.

echo [1/4] Analizando archivos principales para consolidacion...
echo.

echo 📁 Examinando API de Properties:
echo - Archivo principal: Backend\src\app\api\properties\route.ts
if exist "Backend\src\app\api\properties\route.ts" (
    echo   ✅ Encontrado
) else (
    echo   ❌ No encontrado
)

echo - Archivo fixed: Backend\src\app\api\properties\route-fixed.ts
if exist "Backend\src\app\api\properties\route-fixed.ts" (
    echo   ✅ Encontrado
) else (
    echo   ❌ No encontrado
)

echo.
echo 📁 Examinando Formulario de Publicacion:
echo - Archivo principal: Backend\src\app\publicar\page.tsx
if exist "Backend\src\app\publicar\page.tsx" (
    echo   ✅ Encontrado
) else (
    echo   ❌ No encontrado
)

echo - Archivo fixed: Backend\src\app\publicar\page-fixed.tsx
if exist "Backend\src\app\publicar\page-fixed.tsx" (
    echo   ✅ Encontrado
) else (
    echo   ❌ No encontrado
)

echo.
echo [2/4] Comparando tamaños de archivos para determinar version mas completa...
echo.

echo 📊 Tamaños de APIs de Properties:
for %%f in ("Backend\src\app\api\properties\route*.ts") do (
    echo   %%~nxf: %%~zf bytes
)

echo.
echo 📊 Tamaños de Formularios de Publicacion:
for %%f in ("Backend\src\app\publicar\page*.tsx") do (
    echo   %%~nxf: %%~zf bytes
)

echo.
echo [3/4] Creando reporte de analisis...
echo # REPORTE ANALISIS ARCHIVOS - FASE 2 > REPORTE-ANALISIS-FASE-2.md
echo. >> REPORTE-ANALISIS-FASE-2.md
echo ## APIs de Properties >> REPORTE-ANALISIS-FASE-2.md
echo ```bash >> REPORTE-ANALISIS-FASE-2.md
for %%f in ("Backend\src\app\api\properties\route*.ts") do (
    echo %%~nxf: %%~zf bytes >> REPORTE-ANALISIS-FASE-2.md
)
echo ``` >> REPORTE-ANALISIS-FASE-2.md
echo. >> REPORTE-ANALISIS-FASE-2.md
echo ## Formularios de Publicacion >> REPORTE-ANALISIS-FASE-2.md
echo ```bash >> REPORTE-ANALISIS-FASE-2.md
for %%f in ("Backend\src\app\publicar\page*.tsx") do (
    echo %%~nxf: %%~zf bytes >> REPORTE-ANALISIS-FASE-2.md
)
echo ``` >> REPORTE-ANALISIS-FASE-2.md

echo.
echo [4/4] Preparando para consolidacion...
echo.
echo ⚠️  IMPORTANTE: Antes de proceder con la consolidacion, necesitamos:
echo    1. Revisar el contenido de los archivos principales
echo    2. Identificar la version mas completa y funcional
echo    3. Consolidar las mejores caracteristicas de cada version
echo.

echo ========================================
echo ✅ FASE 2 - ANALISIS COMPLETADO
echo ========================================
echo.
echo Archivos generados:
echo - REPORTE-ANALISIS-FASE-2.md
echo.
echo Proximo paso: Revisar archivos y ejecutar consolidacion
pause
