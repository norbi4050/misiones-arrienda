@echo off
echo ========================================
echo FASE 1: AUDITORIA Y MAPEO DE ARCHIVOS CRITICOS
echo ========================================
echo.

echo [1/5] Creando backup de seguridad...
if not exist "BACKUP-CONSOLIDACION" mkdir "BACKUP-CONSOLIDACION"
xcopy "Backend\src\app\api\properties\*.ts" "BACKUP-CONSOLIDACION\api-properties\" /Y /I
xcopy "Backend\src\app\publicar\*.tsx" "BACKUP-CONSOLIDACION\publicar\" /Y /I
xcopy "Backend\src\hooks\useAuth*.ts" "BACKUP-CONSOLIDACION\hooks\" /Y /I
xcopy "Backend\src\components\filter-section*.tsx" "BACKUP-CONSOLIDACION\components\" /Y /I
echo ✅ Backup creado en BACKUP-CONSOLIDACION\

echo.
echo [2/5] Identificando archivos duplicados...
echo.
echo 📁 APIs de Propiedades:
dir "Backend\src\app\api\properties\route*.ts" /B 2>nul
echo.
echo 📁 Formularios de Publicación:
dir "Backend\src\app\publicar\page*.tsx" /B 2>nul
echo.
echo 📁 Hooks de Autenticación:
dir "Backend\src\hooks\useAuth*.ts" /B 2>nul
echo.
echo 📁 Componentes de Filtros:
dir "Backend\src\components\filter-section*.tsx" /B 2>nul

echo.
echo [3/5] Analizando archivos SQL de Supabase...
echo.
echo 📁 Archivos SQL encontrados:
dir "Backend\SUPABASE-*.sql" /B 2>nul | find /C /V "" && echo archivos SQL de Supabase encontrados

echo.
echo [4/5] Generando reporte de duplicados...
echo # REPORTE DE ARCHIVOS DUPLICADOS - FASE 1 > REPORTE-DUPLICADOS-FASE-1.md
echo. >> REPORTE-DUPLICADOS-FASE-1.md
echo ## APIs de Propiedades >> REPORTE-DUPLICADOS-FASE-1.md
echo ```bash >> REPORTE-DUPLICADOS-FASE-1.md
dir "Backend\src\app\api\properties\route*.ts" /B 2>nul >> REPORTE-DUPLICADOS-FASE-1.md
echo ``` >> REPORTE-DUPLICADOS-FASE-1.md
echo. >> REPORTE-DUPLICADOS-FASE-1.md
echo ## Formularios de Publicación >> REPORTE-DUPLICADOS-FASE-1.md
echo ```bash >> REPORTE-DUPLICADOS-FASE-1.md
dir "Backend\src\app\publicar\page*.tsx" /B 2>nul >> REPORTE-DUPLICADOS-FASE-1.md
echo ``` >> REPORTE-DUPLICADOS-FASE-1.md

echo.
echo [5/5] Creando lista de archivos a mantener/eliminar...
echo # DECISION MATRIX - ARCHIVOS CRITICOS > DECISION-MATRIX-ARCHIVOS.md
echo. >> DECISION-MATRIX-ARCHIVOS.md
echo ## ✅ MANTENER >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/app/api/properties/route.ts >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/app/publicar/page.tsx >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/hooks/useAuth.ts >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/components/filter-section.tsx >> DECISION-MATRIX-ARCHIVOS.md
echo. >> DECISION-MATRIX-ARCHIVOS.md
echo ## ❌ ELIMINAR >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/app/api/properties/route-*.ts (todas las variantes) >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/app/publicar/page-*.tsx (excepto page.tsx) >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/hooks/useAuth-*.ts (todas las variantes) >> DECISION-MATRIX-ARCHIVOS.md
echo - Backend/src/components/filter-section-*.tsx (todas las variantes) >> DECISION-MATRIX-ARCHIVOS.md

echo.
echo ========================================
echo ✅ FASE 1 COMPLETADA
echo ========================================
echo.
echo Archivos generados:
echo - BACKUP-CONSOLIDACION\ (backup de seguridad)
echo - REPORTE-DUPLICADOS-FASE-1.md
echo - DECISION-MATRIX-ARCHIVOS.md
echo.
echo Próximo paso: Revisar los reportes y ejecutar FASE 2
pause
