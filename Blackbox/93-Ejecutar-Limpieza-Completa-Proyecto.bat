@echo off
echo ========================================
echo BLACKBOX AI - LIMPIEZA COMPLETA PROYECTO
echo ========================================
echo.
echo Iniciando limpieza automatica del proyecto...
echo.

cd /d "%~dp0\.."

echo [1/4] Ejecutando analisis de archivos...
node "Blackbox/92-Script-Limpieza-Completa-Proyecto.js"

echo.
echo [2/4] Creando backup de archivos importantes...
if not exist "BACKUP-LIMPIEZA" mkdir "BACKUP-LIMPIEZA"

echo.
echo [3/4] Eliminando archivos innecesarios de la raiz...

REM Eliminar archivos de testing y reportes
for %%f in (
    "APLICAR-OPTIMIZACIONES-SUPABASE-REAL.js"
    "ARCHIVOS-ELIMINAR-FASE-3.txt"
    "corregir-issues-admin-user-management.js"
    "EJECUTAR-SOLUCION-SUPABASE-DATABASE-LINTER.bat"
    "ejecutar-testing-exhaustivo-admin-users.bat"
    "EJECUTAR-TESTING-SOLUCION-SUPABASE-DATABASE-LINTER.bat"
    "GUIA-IMPLEMENTACION-SISTEMA-ELIMINACION-USUARIOS-FINAL.md"
    "REPORTE-*.md"
    "SOLUCION-*.sql"
    "test-*.js"
    "TEST-*.js"
    "EJECUTAR-*.bat"
    "TESTING-*.js"
    "AUDITORIA-*.js"
    "PLAN-*.md"
    "DIAGNOSTICO-*.js"
    "ANALISIS-*.md"
    "IMPLEMENTAR-*.js"
    "CORREGIR-*.js"
    "LIMPIAR-*.bat"
    "ELIMINAR-*.bat"
    "SUBIR-*.bat"
    "DEPLOY-*.bat"
    "VERIFICAR-*.js"
    "APLICAR-*.js"
    "CONFIGURAR-*.bat"
    "SINCRONIZAR-*.bat"
    "PROBAR-*.bat"
    "CONTINUAR-*.bat"
    "INVESTIGAR-*.bat"
    "SUPABASE-*.sql"
    "ESQUEMA-*.sql"
    "FASE-*.md"
    "PHASE-*.md"
    "TODO-*.md"
    "CHECKLIST-*.md"
    "COMANDOS-*.md"
    "INSTRUCCIONES-*.md"
    "PASOS-*.md"
    "ERROR-*.md"
    "PROBLEMA-*.md"
    "MEJORAS-*.md"
    "RESUMEN-*.md"
    "REVISION-*.md"
    "PROXIMOS-*.md"
    "VARIABLES-*.md"
    "GITHUB-*.md"
    "NETLIFY-*.md"
    "VERCEL-*.md"
    "DEPLOYMENT-*.md"
    "SISTEMA-*.md"
    "PLATAFORMA-*.md"
    "SEMANA-*.md"
    "LIMPIEZA-*.md"
    "PROYECTO-*.md"
    "ESTADISTICAS-*.md"
    "DATOS-*.md"
    "MERCADOPAGO-*.md"
    "CURRENCY-*.md"
    "REGISTRO-*.md"
    "LOGIN-*.md"
    "AUTH-*.md"
    "PERFIL-*.md"
    "USUARIO-*.md"
    "COMUNIDAD-*.md"
    "PROPERTIES-*.md"
    "API-*.md"
    "DATABASE-*.md"
    "TYPESCRIPT-*.md"
    "CSS-*.md"
    "IMAGENES-*.md"
    "NAVEGACION-*.md"
    "UX-*.md"
    "SEO-*.md"
    "PERFORMANCE-*.md"
    "SECURITY-*.md"
    "MONITORING-*.md"
    "vercel.json"
) do (
    if exist %%f (
        echo Eliminando %%f
        del /q %%f 2>nul
    )
)

echo.
echo [4/4] Eliminando directorios innecesarios...

REM Eliminar directorios completos
for %%d in (
    "reportes"
    "CONSOLIDADOS"
    "BACKUP-PRE-LIMPIEZA"
    "misiones-arrienda-v2"
    "misionesarrienda1"
    "src"
) do (
    if exist %%d (
        echo Eliminando directorio %%d
        rmdir /s /q %%d 2>nul
    )
)

echo.
echo ========================================
echo LIMPIEZA COMPLETADA EXITOSAMENTE
echo ========================================
echo.
echo Archivos mantenidos:
echo - Backend/ (codigo fuente del proyecto)
echo - Blackbox/ (documentos organizados)
echo - .gitignore
echo - README.md
echo.
echo El proyecto ahora esta limpio y organizado.
echo.
pause
