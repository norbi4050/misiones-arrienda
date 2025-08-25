@echo off
echo ========================================
echo   ELIMINANDO SUPABASE Y SUBIENDO A GITHUB
echo ========================================
echo.

echo Paso 1: Eliminando carpeta supabase localmente...
if exist Backend\supabase (
    echo ✅ Eliminando carpeta supabase...
    attrib -r -h -s Backend\supabase\*.* /s /d 2>nul
    del /f /s /q Backend\supabase\*.* 2>nul
    rmdir /s /q Backend\supabase 2>nul
) else (
    echo ✅ Carpeta supabase no existe localmente
)

echo.
echo Paso 2: Verificando eliminación local...
if exist Backend\supabase (
    echo ❌ ERROR: No se pudo eliminar localmente
    pause
    exit /b 1
) else (
    echo ✅ Carpeta eliminada localmente
)

echo.
echo Paso 3: Agregando cambios a git...
git add -A
if %errorlevel% neq 0 (
    echo ❌ Error al agregar cambios a git
    pause
    exit /b 1
)

echo.
echo Paso 4: Haciendo commit...
git commit -m "Fix: Eliminar carpeta supabase para resolver error Deno en Netlify"
if %errorlevel% neq 0 (
    echo ⚠️ No hay cambios para commit o error en commit
)

echo.
echo Paso 5: Subiendo a GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Error al subir a GitHub
    echo Intentando con master...
    git push origin master
    if %errorlevel% neq 0 (
        echo ❌ Error al subir a GitHub con master
        pause
        exit /b 1
    )
)

echo.
echo ✅ ÉXITO: Carpeta supabase eliminada y cambios subidos a GitHub
echo ✅ El error de Netlify debería estar resuelto
echo.
echo Próximo paso: Hacer nuevo deploy en Netlify
echo.
pause
