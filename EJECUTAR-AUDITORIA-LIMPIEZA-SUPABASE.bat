@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   AUDITORÍA Y LIMPIEZA SUPABASE 2025
echo ========================================
echo.
echo Este script ejecuta la auditoría completa de esquemas
echo duplicados en Supabase y opcionalmente procede con
echo la limpieza segura.
echo.
echo IMPORTANTE: Asegúrate de tener configuradas las
echo variables de entorno de Supabase antes de continuar.
echo.
echo Variables requeridas:
echo - NEXT_PUBLIC_SUPABASE_URL
echo - SUPABASE_SERVICE_ROLE_KEY
echo.

:MENU
echo ========================================
echo           MENÚ DE OPCIONES
echo ========================================
echo.
echo 1. Verificar datos únicos (RECOMENDADO PRIMERO)
echo 2. Ver auditoría completa de esquemas
echo 3. Ejecutar limpieza de tablas duplicadas
echo 4. Salir
echo.
set /p opcion="Selecciona una opción (1-4): "

if "%opcion%"=="1" goto VERIFICAR_DATOS
if "%opcion%"=="2" goto VER_AUDITORIA
if "%opcion%"=="3" goto EJECUTAR_LIMPIEZA
if "%opcion%"=="4" goto SALIR
echo Opción inválida. Intenta de nuevo.
goto MENU

:VERIFICAR_DATOS
echo.
echo ========================================
echo    VERIFICANDO DATOS ÚNICOS...
echo ========================================
echo.
echo Ejecutando script de verificación...
node SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ADVERTENCIA: Se encontraron datos únicos que requieren migración.
    echo    NO proceder con la limpieza hasta resolver esto.
    echo.
    pause
    goto MENU
) else (
    echo.
    echo ✅ Verificación completada. Es seguro proceder con la limpieza.
    echo.
    pause
    goto MENU
)

:VER_AUDITORIA
echo.
echo ========================================
echo      ABRIENDO AUDITORÍA COMPLETA
echo ========================================
echo.
echo Abriendo archivo de auditoría...
start "" "AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md"
echo.
echo Archivo abierto. Revisa los detalles antes de proceder.
echo.
pause
goto MENU

:EJECUTAR_LIMPIEZA
echo.
echo ========================================
echo        LIMPIEZA DE TABLAS
echo ========================================
echo.
echo ⚠️  ADVERTENCIA CRÍTICA ⚠️
echo.
echo Esta operación eliminará permanentemente las tablas
echo duplicadas identificadas en la auditoría.
echo.
echo ANTES DE CONTINUAR, asegúrate de haber:
echo ✓ Creado un backup completo de la base de datos
echo ✓ Ejecutado la verificación de datos únicos
echo ✓ Migrado cualquier dato único identificado
echo ✓ Confirmado que el código usa solo tablas PascalCase
echo.
set /p confirmar="¿Estás seguro de continuar? (SI/no): "

if /i "%confirmar%"=="SI" (
    echo.
    echo Ejecutando limpieza de tablas duplicadas...
    echo.
    echo NOTA: Este proceso puede tomar varios minutos.
    echo       No interrumpas la ejecución.
    echo.
    
    REM Aquí ejecutarías el script SQL a través de psql o tu cliente preferido
    echo Para ejecutar el script SQL, usa uno de estos métodos:
    echo.
    echo MÉTODO 1 - psql (PostgreSQL):
    echo psql -h [host] -U [user] -d [database] -f SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
    echo.
    echo MÉTODO 2 - Supabase Dashboard:
    echo 1. Ve a tu proyecto en dashboard.supabase.com
    echo 2. Navega a SQL Editor
    echo 3. Copia y pega el contenido de SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
    echo 4. Ejecuta el script
    echo.
    echo MÉTODO 3 - Cliente de base de datos:
    echo Usa tu cliente preferido (pgAdmin, DBeaver, etc.) para ejecutar el script
    echo.
    pause
    
    echo.
    echo ========================================
    echo     LIMPIEZA INICIADA MANUALMENTE
    echo ========================================
    echo.
    echo El script SQL está listo para ejecutar.
    echo Sigue las instrucciones mostradas arriba.
    echo.
    echo Después de ejecutar el script SQL:
    echo 1. Verifica que no haya errores
    echo 2. Confirma que las tablas principales siguen existiendo
    echo 3. Prueba las APIs críticas
    echo 4. Monitorea los logs de la aplicación
    echo.
    pause
    goto MENU
) else (
    echo.
    echo Operación cancelada. Regresando al menú principal.
    echo.
    pause
    goto MENU
)

:SALIR
echo.
echo ========================================
echo           RESUMEN FINAL
echo ========================================
echo.
echo Archivos generados:
echo ✓ AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md
echo ✓ SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
echo ✓ SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
echo.
echo Próximos pasos recomendados:
echo 1. Revisar la auditoría completa
echo 2. Ejecutar verificación de datos únicos
echo 3. Crear backup completo de la base de datos
echo 4. Ejecutar limpieza solo si es seguro
echo 5. Verificar funcionamiento post-limpieza
echo.
echo ¡Gracias por usar la herramienta de auditoría!
echo.
pause
exit /b 0

:ERROR
echo.
echo ❌ Error durante la ejecución.
echo Revisa los logs y las configuraciones.
echo.
pause
exit /b 1
