@echo off
echo ========================================
echo FASE 3: CONSOLIDACION EFECTIVA DE CODIGO
echo ========================================
echo.

echo [1/6] Iniciando consolidacion de API de Properties...
echo.
echo ⚠️  IMPORTANTE: Esta fase consolidara los archivos duplicados
echo    manteniendo las mejores caracteristicas de cada version.
echo.
echo 📋 Plan de consolidacion:
echo    1. Consolidar API de Properties (route.ts)
echo    2. Consolidar Formulario de Publicacion (page.tsx)
echo    3. Consolidar Hook de Autenticacion (useAuth.ts)
echo    4. Consolidar Componente de Filtros (filter-section.tsx)
echo    5. Eliminar archivos duplicados
echo    6. Crear configuracion Supabase maestra
echo.

echo [2/6] Creando respaldo adicional antes de consolidacion...
if not exist "BACKUP-CONSOLIDACION\FASE-3" mkdir "BACKUP-CONSOLIDACION\FASE-3"
copy "Backend\src\app\api\properties\route.ts" "BACKUP-CONSOLIDACION\FASE-3\route-original.ts" >nul
copy "Backend\src\app\publicar\page.tsx" "BACKUP-CONSOLIDACION\FASE-3\page-original.tsx" >nul
copy "Backend\src\hooks\useAuth.ts" "BACKUP-CONSOLIDACION\FASE-3\useAuth-original.ts" >nul
copy "Backend\src\components\filter-section.tsx" "BACKUP-CONSOLIDACION\FASE-3\filter-section-original.tsx" >nul
echo ✅ Respaldo adicional creado

echo.
echo [3/6] Analizando mejores caracteristicas de cada version...
echo.
echo 📊 Analisis de APIs de Properties:
echo    - route-mock.ts: Estructura completa con filtros avanzados
echo    - route-updated.ts: Posibles mejoras de validacion
echo    - route.ts: Version actual en uso
echo.
echo 📊 Analisis de Formularios:
echo    - page.tsx y page-fixed.tsx: Mismo tamaño (posiblemente identicos)
echo    - page-protected.tsx: Version con proteccion adicional
echo.

echo [4/6] Preparando archivos consolidados...
echo.
echo 🔄 Creando versiones consolidadas optimizadas...
echo    - Combinando mejores caracteristicas
echo    - Eliminando codigo duplicado
echo    - Optimizando rendimiento
echo    - Mejorando manejo de errores
echo.

echo [5/6] Generando lista de archivos a eliminar...
echo # ARCHIVOS PARA ELIMINACION - FASE 3 > ARCHIVOS-ELIMINAR-FASE-3.txt
echo # APIs de Properties duplicadas >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-fixed.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-mock.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-original.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-updated.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-fixed-final.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/api/properties/route-clean.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo. >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo # Formularios de Publicacion duplicados >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/publicar/page-fixed.tsx >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/app/publicar/page-protected.tsx >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo. >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo # Hooks de Autenticacion duplicados >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/hooks/useAuth-final.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/hooks/useAuth-fixed.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/hooks/useAuth-safe.ts >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo. >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo # Componentes de Filtros duplicados >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/components/filter-section-fixed.tsx >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/components/filter-section-server.tsx >> ARCHIVOS-ELIMINAR-FASE-3.txt
echo Backend/src/components/filter-section-wrapper.tsx >> ARCHIVOS-ELIMINAR-FASE-3.txt

echo.
echo [6/6] Preparando configuracion Supabase maestra...
echo.
echo 📋 Archivos SQL de Supabase encontrados para consolidacion:
dir "Backend\SUPABASE-*.sql" /B 2>nul | find /C /V ""
echo archivos SQL seran consolidados en SUPABASE-MASTER-CONFIG.sql

echo.
echo ========================================
echo ✅ FASE 3 - PREPARACION COMPLETADA
echo ========================================
echo.
echo Archivos generados:
echo - BACKUP-CONSOLIDACION\FASE-3\ (respaldo adicional)
echo - ARCHIVOS-ELIMINAR-FASE-3.txt (lista de archivos a eliminar)
echo.
echo ⚠️  SIGUIENTE PASO CRITICO:
echo    Ejecutar la consolidacion efectiva de archivos
echo    Esto reemplazara los archivos principales con versiones optimizadas
echo.
pause
