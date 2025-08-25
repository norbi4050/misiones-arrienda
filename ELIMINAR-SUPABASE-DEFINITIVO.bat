@echo off
echo ========================================
echo   ELIMINANDO CARPETA SUPABASE DEFINITIVAMENTE
echo ========================================
echo.

echo Paso 1: Verificando si existe la carpeta supabase...
if exist Backend\supabase (
    echo ✅ Carpeta supabase encontrada - Eliminando...
    rmdir /s /q Backend\supabase
    if exist Backend\supabase (
        echo ❌ Error: No se pudo eliminar completamente
        echo Intentando con attrib...
        attrib -r -h -s Backend\supabase\*.* /s /d
        rmdir /s /q Backend\supabase
    )
) else (
    echo ✅ Carpeta supabase no existe
)

echo.
echo Paso 2: Verificando eliminación...
if exist Backend\supabase (
    echo ❌ ERROR: La carpeta supabase AUN EXISTE
    echo Intentando eliminación forzada...
    del /f /s /q Backend\supabase\*.*
    rmdir /s /q Backend\supabase
) else (
    echo ✅ ÉXITO: Carpeta supabase eliminada completamente
)

echo.
echo Paso 3: Verificación final...
if exist Backend\supabase (
    echo ❌ CRÍTICO: No se pudo eliminar la carpeta
    echo Debes eliminarla manualmente desde el explorador
    pause
) else (
    echo ✅ CONFIRMADO: Carpeta supabase eliminada definitivamente
    echo ✅ El error de Netlify debería estar resuelto
)

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
echo.
echo Próximo paso: Ejecutar SOLUCION-GITHUB-DEFINITIVA.bat
echo.
pause
