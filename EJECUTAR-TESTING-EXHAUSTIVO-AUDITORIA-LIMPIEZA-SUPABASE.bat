@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   TESTING EXHAUSTIVO - AUDITORÍA Y 
echo   LIMPIEZA SUPABASE 2025
echo ========================================
echo.
echo Este script ejecuta testing exhaustivo de todos
echo los componentes de la auditoría y limpieza de
echo esquemas duplicados en Supabase.
echo.
echo FASES DE TESTING:
echo ✓ Verificación de archivos generados
echo ✓ Validación de contenido de auditoría
echo ✓ Testing del script de verificación
echo ✓ Validación del script SQL de limpieza
echo ✓ Testing de integridad de datos
echo ✓ Verificación de impacto en APIs
echo ✓ Testing de configuración de Supabase
echo ✓ Validación de documentación
echo ✓ Testing de seguridad y rollback
echo.

:MENU
echo ========================================
echo           MENÚ DE TESTING
echo ========================================
echo.
echo 1. Ejecutar testing exhaustivo completo
echo 2. Ver archivos de auditoría generados
echo 3. Verificar solo scripts críticos
echo 4. Testing de seguridad únicamente
echo 5. Ver último reporte de testing
echo 6. Salir
echo.
set /p opcion="Selecciona una opción (1-6): "

if "%opcion%"=="1" goto TESTING_COMPLETO
if "%opcion%"=="2" goto VER_ARCHIVOS
if "%opcion%"=="3" goto TESTING_SCRIPTS
if "%opcion%"=="4" goto TESTING_SEGURIDAD
if "%opcion%"=="5" goto VER_REPORTE
if "%opcion%"=="6" goto SALIR
echo Opción inválida. Intenta de nuevo.
goto MENU

:TESTING_COMPLETO
echo.
echo ========================================
echo    EJECUTANDO TESTING EXHAUSTIVO
echo ========================================
echo.
echo 🚀 Iniciando testing exhaustivo completo...
echo.
echo IMPORTANTE: Este proceso puede tomar varios minutos
echo y verificará todos los aspectos de la auditoría.
echo.
set /p confirmar="¿Continuar con el testing exhaustivo? (S/n): "

if /i "%confirmar%"=="n" goto MENU

echo.
echo ⏳ Ejecutando testing exhaustivo...
echo.

REM Verificar que Node.js esté disponible
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Para instalar Node.js:
    echo 1. Ve a https://nodejs.org/
    echo 2. Descarga e instala la versión LTS
    echo 3. Reinicia esta ventana de comandos
    echo.
    pause
    goto MENU
)

REM Ejecutar el script de testing
node TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Testing exhaustivo completado exitosamente
    echo.
    echo 📄 Reporte generado: REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md
    echo.
    set /p ver_reporte="¿Ver el reporte ahora? (S/n): "
    if /i not "%ver_reporte%"=="n" (
        start "" "REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md"
    )
) else (
    echo.
    echo ❌ Error durante el testing exhaustivo
    echo Revisa los mensajes de error anteriores
    echo.
)

echo.
pause
goto MENU

:VER_ARCHIVOS
echo.
echo ========================================
echo      ARCHIVOS DE AUDITORÍA
echo ========================================
echo.
echo Verificando archivos generados...
echo.

if exist "AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md" (
    echo ✅ AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md
    for %%A in ("AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md") do echo    Tamaño: %%~zA bytes
) else (
    echo ❌ AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md - NO ENCONTRADO
)

if exist "SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js" (
    echo ✅ SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
    for %%A in ("SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js") do echo    Tamaño: %%~zA bytes
) else (
    echo ❌ SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js - NO ENCONTRADO
)

if exist "SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql" (
    echo ✅ SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
    for %%A in ("SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql") do echo    Tamaño: %%~zA bytes
) else (
    echo ❌ SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql - NO ENCONTRADO
)

if exist "EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat" (
    echo ✅ EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat
    for %%A in ("EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat") do echo    Tamaño: %%~zA bytes
) else (
    echo ❌ EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat - NO ENCONTRADO
)

echo.
set /p abrir="¿Abrir la auditoría completa? (S/n): "
if /i not "%abrir%"=="n" (
    if exist "AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md" (
        start "" "AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md"
    ) else (
        echo ❌ El archivo de auditoría no existe
    )
)

echo.
pause
goto MENU

:TESTING_SCRIPTS
echo.
echo ========================================
echo     TESTING DE SCRIPTS CRÍTICOS
echo ========================================
echo.
echo Verificando scripts críticos únicamente...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está disponible
    pause
    goto MENU
)

REM Crear script temporal para testing de scripts únicamente
echo const fs = require('fs'); > temp_script_test.js
echo. >> temp_script_test.js
echo console.log('🔍 TESTING DE SCRIPTS CRÍTICOS'); >> temp_script_test.js
echo console.log('================================'); >> temp_script_test.js
echo. >> temp_script_test.js
echo // Verificar script de verificación >> temp_script_test.js
echo try { >> temp_script_test.js
echo   const scriptContent = fs.readFileSync('SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js', 'utf8'); >> temp_script_test.js
echo   console.log('✅ Script de verificación: EXISTE'); >> temp_script_test.js
echo   console.log('   Tamaño:', Math.round(scriptContent.length/1024), 'KB'); >> temp_script_test.js
echo   >> temp_script_test.js
echo   // Verificar funciones críticas >> temp_script_test.js
echo   const functions = ['verificarDatosUnicos', 'conectarSupabase', 'generarReporte']; >> temp_script_test.js
echo   functions.forEach(func =^> { >> temp_script_test.js
echo     if (scriptContent.includes(func)) { >> temp_script_test.js
echo       console.log('   ✅ Función', func, 'encontrada'); >> temp_script_test.js
echo     } else { >> temp_script_test.js
echo       console.log('   ❌ Función', func, 'FALTANTE'); >> temp_script_test.js
echo     } >> temp_script_test.js
echo   }); >> temp_script_test.js
echo } catch (error) { >> temp_script_test.js
echo   console.log('❌ Script de verificación: NO ENCONTRADO'); >> temp_script_test.js
echo } >> temp_script_test.js
echo. >> temp_script_test.js
echo // Verificar script SQL >> temp_script_test.js
echo try { >> temp_script_test.js
echo   const sqlContent = fs.readFileSync('SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql', 'utf8'); >> temp_script_test.js
echo   console.log('✅ Script SQL de limpieza: EXISTE'); >> temp_script_test.js
echo   console.log('   Tamaño:', Math.round(sqlContent.length/1024), 'KB'); >> temp_script_test.js
echo   >> temp_script_test.js
echo   // Verificar comandos críticos >> temp_script_test.js
echo   const dropCount = (sqlContent.match(/DROP TABLE IF EXISTS/g) ^|^| []).length; >> temp_script_test.js
echo   console.log('   📊 Comandos DROP TABLE encontrados:', dropCount); >> temp_script_test.js
echo   >> temp_script_test.js
echo   if (sqlContent.includes('CREATE SCHEMA IF NOT EXISTS backup_limpieza_2025')) { >> temp_script_test.js
echo     console.log('   ✅ Comandos de backup: PRESENTES'); >> temp_script_test.js
echo   } else { >> temp_script_test.js
echo     console.log('   ❌ Comandos de backup: FALTANTES'); >> temp_script_test.js
echo   } >> temp_script_test.js
echo   >> temp_script_test.js
echo   if (sqlContent.includes('rollback_limpieza_tablas')) { >> temp_script_test.js
echo     console.log('   ✅ Función de rollback: PRESENTE'); >> temp_script_test.js
echo   } else { >> temp_script_test.js
echo     console.log('   ❌ Función de rollback: FALTANTE'); >> temp_script_test.js
echo   } >> temp_script_test.js
echo } catch (error) { >> temp_script_test.js
echo   console.log('❌ Script SQL de limpieza: NO ENCONTRADO'); >> temp_script_test.js
echo } >> temp_script_test.js

node temp_script_test.js
del temp_script_test.js

echo.
pause
goto MENU

:TESTING_SEGURIDAD
echo.
echo ========================================
echo      TESTING DE SEGURIDAD
echo ========================================
echo.
echo Verificando medidas de seguridad implementadas...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está disponible
    pause
    goto MENU
)

REM Crear script temporal para testing de seguridad
echo const fs = require('fs'); > temp_security_test.js
echo. >> temp_security_test.js
echo console.log('🔒 TESTING DE SEGURIDAD'); >> temp_security_test.js
echo console.log('======================='); >> temp_security_test.js
echo. >> temp_security_test.js
echo try { >> temp_security_test.js
echo   const sqlContent = fs.readFileSync('SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql', 'utf8'); >> temp_security_test.js
echo   >> temp_security_test.js
echo   console.log('🔍 Verificando medidas de seguridad...'); >> temp_security_test.js
echo   console.log(''); >> temp_security_test.js
echo   >> temp_security_test.js
echo   // Verificar backups >> temp_security_test.js
echo   if (sqlContent.includes('CREATE SCHEMA IF NOT EXISTS backup_limpieza_2025')) { >> temp_security_test.js
echo     console.log('✅ Esquema de backup configurado'); >> temp_security_test.js
echo   } else { >> temp_security_test.js
echo     console.log('❌ CRÍTICO: Esquema de backup FALTANTE'); >> temp_security_test.js
echo   } >> temp_security_test.js
echo   >> temp_security_test.js
echo   // Verificar verificaciones previas >> temp_security_test.js
echo   if (sqlContent.includes('IF NOT EXISTS') ^&^& sqlContent.includes('RAISE EXCEPTION')) { >> temp_security_test.js
echo     console.log('✅ Verificaciones de seguridad implementadas'); >> temp_security_test.js
echo   } else { >> temp_security_test.js
echo     console.log('❌ CRÍTICO: Verificaciones de seguridad FALTANTES'); >> temp_security_test.js
echo   } >> temp_security_test.js
echo   >> temp_security_test.js
echo   // Verificar función de rollback >> temp_security_test.js
echo   if (sqlContent.includes('CREATE OR REPLACE FUNCTION rollback_limpieza_tablas')) { >> temp_security_test.js
echo     console.log('✅ Función de rollback disponible'); >> temp_security_test.js
echo   } else { >> temp_security_test.js
echo     console.log('❌ CRÍTICO: Función de rollback FALTANTE'); >> temp_security_test.js
echo   } >> temp_security_test.js
echo   >> temp_security_test.js
echo   // Verificar comandos peligrosos >> temp_security_test.js
echo   const dangerous = sqlContent.includes('DROP DATABASE') ^|^| >> temp_security_test.js
echo                    sqlContent.includes('DROP SCHEMA public') ^|^| >> temp_security_test.js
echo                    sqlContent.includes('TRUNCATE'); >> temp_security_test.js
echo   >> temp_security_test.js
echo   if (!dangerous) { >> temp_security_test.js
echo     console.log('✅ No se detectaron comandos peligrosos'); >> temp_security_test.js
echo   } else { >> temp_security_test.js
echo     console.log('❌ PELIGRO: Comandos destructivos detectados'); >> temp_security_test.js
echo   } >> temp_security_test.js
echo   >> temp_security_test.js
echo   console.log(''); >> temp_security_test.js
echo   console.log('📋 RESUMEN DE SEGURIDAD:'); >> temp_security_test.js
echo   console.log('- Backups automáticos: ' + (sqlContent.includes('backup_limpieza_2025') ? 'SÍ' : 'NO')); >> temp_security_test.js
echo   console.log('- Verificaciones previas: ' + (sqlContent.includes('IF NOT EXISTS') ? 'SÍ' : 'NO')); >> temp_security_test.js
echo   console.log('- Función de rollback: ' + (sqlContent.includes('rollback_limpieza_tablas') ? 'SÍ' : 'NO')); >> temp_security_test.js
echo   console.log('- Comandos seguros: ' + (!dangerous ? 'SÍ' : 'NO')); >> temp_security_test.js
echo   >> temp_security_test.js
echo } catch (error) { >> temp_security_test.js
echo   console.log('❌ ERROR: No se pudo verificar el script SQL'); >> temp_security_test.js
echo   console.log('Error:', error.message); >> temp_security_test.js
echo } >> temp_security_test.js

node temp_security_test.js
del temp_security_test.js

echo.
pause
goto MENU

:VER_REPORTE
echo.
echo ========================================
echo       ÚLTIMO REPORTE DE TESTING
echo ========================================
echo.

if exist "REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md" (
    echo ✅ Reporte encontrado
    for %%A in ("REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md") do (
        echo    Archivo: REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md
        echo    Tamaño: %%~zA bytes
        echo    Modificado: %%~tA
    )
    echo.
    set /p abrir="¿Abrir el reporte? (S/n): "
    if /i not "%abrir%"=="n" (
        start "" "REPORTE-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.md"
    )
) else (
    echo ❌ No se encontró el reporte de testing
    echo.
    echo Para generar un reporte:
    echo 1. Ejecuta la opción 1 (Testing exhaustivo completo)
    echo 2. El reporte se generará automáticamente
)

echo.
pause
goto MENU

:SALIR
echo.
echo ========================================
echo           RESUMEN FINAL
echo ========================================
echo.
echo Archivos de testing disponibles:
echo ✓ TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.js
echo ✓ EJECUTAR-TESTING-EXHAUSTIVO-AUDITORIA-LIMPIEZA-SUPABASE.bat
echo.
echo Archivos de auditoría:
if exist "AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md" (
    echo ✓ AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md
) else (
    echo ❌ AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md
)

if exist "SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js" (
    echo ✓ SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
) else (
    echo ❌ SCRIPT-VERIFICACION-DATOS-UNICOS-SUPABASE.js
)

if exist "SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql" (
    echo ✓ SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
) else (
    echo ❌ SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql
)

if exist "EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat" (
    echo ✓ EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat
) else (
    echo ❌ EJECUTAR-AUDITORIA-LIMPIEZA-SUPABASE.bat
)

echo.
echo 🔄 PRÓXIMOS PASOS RECOMENDADOS:
echo.
echo 1. Ejecutar testing exhaustivo si no se ha hecho
echo 2. Revisar el reporte de testing generado
echo 3. Corregir cualquier error identificado
echo 4. Proceder con la auditoría y limpieza real
echo.
echo ¡Gracias por usar el sistema de testing exhaustivo!
echo.
pause
exit /b 0

:ERROR
echo.
echo ❌ Error durante la ejecución del testing.
echo Revisa los logs y las configuraciones.
echo.
pause
exit /b 1
