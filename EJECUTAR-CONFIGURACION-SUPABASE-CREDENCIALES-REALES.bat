@echo off
echo =====================================================
echo EJECUTANDO CONFIGURACION SUPABASE CON CREDENCIALES REALES
echo Proyecto: Misiones Arrienda
echo Solucion: Permisos esquema publico + Creacion tablas
echo =====================================================
echo.

echo [PASO 1] Verificando archivos necesarios...
if not exist "SUPABASE-CONFIGURACION-PERMISOS-ESQUEMA-PUBLICO.sql" (
    echo ❌ Error: Archivo SQL no encontrado
    pause
    exit /b 1
)

if not exist "CONFIGURAR-SUPABASE-CON-CREDENCIALES-REALES.js" (
    echo ❌ Error: Script de configuracion no encontrado
    pause
    exit /b 1
)

echo ✅ Archivos encontrados correctamente
echo.

echo [PASO 2] Ejecutando configuracion con credenciales reales...
echo.

node CONFIGURAR-SUPABASE-CON-CREDENCIALES-REALES.js

echo.
echo [PASO 3] Verificando resultados...

if exist "REPORTE-CONFIGURACION-SUPABASE-CREDENCIALES-REALES.json" (
    echo ✅ Reporte generado exitosamente
    echo.
    echo 📄 Archivos generados:
    echo - REPORTE-CONFIGURACION-SUPABASE-CREDENCIALES-REALES.json
    echo.
    echo 🔍 Para ver el reporte detallado, abrir el archivo JSON
) else (
    echo ❌ No se genero el reporte - Revisar errores
)

echo.
echo =====================================================
echo CONFIGURACION COMPLETADA
echo =====================================================
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
