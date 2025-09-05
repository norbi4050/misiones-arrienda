@echo off
chcp 65001 >nul
title TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE

:MENU
cls
echo.
echo ================================================================================
echo                    TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE
echo ================================================================================
echo.
echo 🧪 TESTING EXHAUSTIVO COMPLETO DEL SISTEMA DE LIMPIEZA
echo.
echo Este script ejecuta testing exhaustivo que incluye:
echo   • Verificación de archivos críticos existentes
echo   • Testing de funcionalidad de scripts JavaScript
echo   • Testing de funcionalidad de archivos .bat
echo   • Testing de integración del sistema completo
echo   • Testing de casos edge y manejo de errores
echo   • Testing de generación de archivos
echo   • Testing de prerequisitos del sistema
echo.
echo ================================================================================
echo                                    OPCIONES
echo ================================================================================
echo.
echo [1] 🚀 EJECUTAR TESTING EXHAUSTIVO COMPLETO
echo [2] 🔍 VERIFICAR PREREQUISITOS DEL SISTEMA
echo [3] 📄 VER ÚLTIMO REPORTE DE TESTING
echo [4] 🧹 LIMPIAR ARCHIVOS DE TESTING ANTERIORES
echo [5] ❓ AYUDA Y DOCUMENTACIÓN
echo [6] 🚪 SALIR
echo.
echo ================================================================================
echo.
set /p opcion=Selecciona una opción [1-6]: 

if "%opcion%"=="1" goto EJECUTAR_TESTING
if "%opcion%"=="2" goto VERIFICAR_PREREQUISITOS
if "%opcion%"=="3" goto VER_REPORTE
if "%opcion%"=="4" goto LIMPIAR_ARCHIVOS
if "%opcion%"=="5" goto AYUDA
if "%opcion%"=="6" goto SALIR

echo.
echo ❌ Opción no válida. Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:EJECUTAR_TESTING
cls
echo.
echo ================================================================================
echo                           EJECUTANDO TESTING EXHAUSTIVO
echo ================================================================================
echo.
echo 🧪 Iniciando testing exhaustivo del sistema completo...
echo.

REM Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Para instalar Node.js:
    echo 1. Visita https://nodejs.org/
    echo 2. Descarga la versión LTS
    echo 3. Instala y reinicia el sistema
    echo.
    pause
    goto MENU
)

echo ✅ Node.js detectado correctamente
echo.

REM Verificar que los archivos críticos existan
if not exist "PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js" (
    echo ❌ ERROR: Archivo PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js no encontrado
    echo.
    pause
    goto MENU
)

if not exist "PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js" (
    echo ❌ ERROR: Archivo PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js no encontrado
    echo.
    pause
    goto MENU
)

echo ✅ Archivos críticos del sistema encontrados
echo.
echo 🔄 Ejecutando testing exhaustivo...
echo.

REM Ejecutar el script de testing
node TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js

if errorlevel 1 (
    echo.
    echo ❌ El testing exhaustivo falló con errores críticos
    echo.
    echo 📋 Revisa el reporte generado para más detalles:
    echo    REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
    echo.
) else (
    echo.
    echo ✅ Testing exhaustivo completado exitosamente
    echo.
    echo 📋 Reporte generado:
    echo    REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
    echo.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:VERIFICAR_PREREQUISITOS
cls
echo.
echo ================================================================================
echo                           VERIFICACIÓN DE PREREQUISITOS
echo ================================================================================
echo.
echo 🔍 Verificando prerequisitos del sistema...
echo.

REM Verificar Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NO está instalado
    set nodejs_ok=false
) else (
    for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
    echo ✅ Node.js está instalado: !node_version!
    set nodejs_ok=true
)

echo.

REM Verificar archivos críticos
echo [2/4] Verificando archivos críticos del sistema...
set archivos_ok=true

if exist "PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js" (
    echo ✅ PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js
) else (
    echo ❌ PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js
    set archivos_ok=false
)

if exist "EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat" (
    echo ✅ EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
) else (
    echo ❌ EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
    set archivos_ok=false
)

if exist "PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js" (
    echo ✅ PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js
) else (
    echo ❌ PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js
    set archivos_ok=false
)

if exist "EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat" (
    echo ✅ EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat
) else (
    echo ❌ EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat
    set archivos_ok=false
)

echo.

REM Verificar script de testing
echo [3/4] Verificando script de testing exhaustivo...
if exist "TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js" (
    echo ✅ TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js
    set testing_ok=true
) else (
    echo ❌ TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js
    set testing_ok=false
)

echo.

REM Verificar permisos de escritura
echo [4/4] Verificando permisos de escritura...
echo test > test_write.tmp 2>nul
if exist test_write.tmp (
    del test_write.tmp >nul 2>&1
    echo ✅ Permisos de escritura correctos
    set permisos_ok=true
) else (
    echo ❌ Sin permisos de escritura en el directorio actual
    set permisos_ok=false
)

echo.
echo ================================================================================
echo                              RESUMEN DE PREREQUISITOS
echo ================================================================================
echo.

if "%nodejs_ok%"=="true" if "%archivos_ok%"=="true" if "%testing_ok%"=="true" if "%permisos_ok%"=="true" (
    echo 🟢 ESTADO: TODOS LOS PREREQUISITOS CUMPLIDOS
    echo.
    echo ✅ El sistema está listo para ejecutar testing exhaustivo
    echo.
) else (
    echo 🔴 ESTADO: PREREQUISITOS FALTANTES
    echo.
    echo ❌ Corrige los errores antes de ejecutar testing
    echo.
    if "%nodejs_ok%"=="false" (
        echo 📋 ACCIÓN REQUERIDA: Instalar Node.js desde https://nodejs.org/
    )
    if "%archivos_ok%"=="false" (
        echo 📋 ACCIÓN REQUERIDA: Verificar que todos los archivos del sistema estén presentes
    )
    if "%testing_ok%"=="false" (
        echo 📋 ACCIÓN REQUERIDA: Verificar que el script de testing esté presente
    )
    if "%permisos_ok%"=="false" (
        echo 📋 ACCIÓN REQUERIDA: Ejecutar como administrador o cambiar permisos del directorio
    )
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:VER_REPORTE
cls
echo.
echo ================================================================================
echo                              ÚLTIMO REPORTE DE TESTING
echo ================================================================================
echo.

if exist "REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md" (
    echo 📄 Abriendo último reporte de testing...
    echo.
    echo Archivo: REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
    echo.
    
    REM Intentar abrir con el editor predeterminado
    start "" "REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md" 2>nul
    
    if errorlevel 1 (
        echo ⚠️  No se pudo abrir automáticamente el reporte
        echo.
        echo 📋 Puedes abrir manualmente el archivo:
        echo    REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
        echo.
    ) else (
        echo ✅ Reporte abierto en el editor predeterminado
        echo.
    )
) else (
    echo ❌ No se encontró reporte de testing previo
    echo.
    echo 💡 Ejecuta primero el testing exhaustivo para generar un reporte
    echo.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:LIMPIAR_ARCHIVOS
cls
echo.
echo ================================================================================
echo                           LIMPIAR ARCHIVOS DE TESTING
echo ================================================================================
echo.
echo 🧹 Esta opción eliminará archivos temporales de testing anteriores
echo.
echo Archivos que se eliminarán (si existen):
echo   • REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
echo   • Archivos temporales de testing (.tmp, .log)
echo.
echo ⚠️  ADVERTENCIA: Esta acción no se puede deshacer
echo.
set /p confirmar=¿Deseas continuar? [S/N]: 

if /i "%confirmar%"=="S" goto EJECUTAR_LIMPIEZA
if /i "%confirmar%"=="SI" goto EJECUTAR_LIMPIEZA
if /i "%confirmar%"=="Y" goto EJECUTAR_LIMPIEZA
if /i "%confirmar%"=="YES" goto EJECUTAR_LIMPIEZA

echo.
echo ❌ Operación cancelada
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:EJECUTAR_LIMPIEZA
echo.
echo 🔄 Limpiando archivos de testing...
echo.

set archivos_eliminados=0

if exist "REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md" (
    del "REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md" >nul 2>&1
    echo ✅ Eliminado: REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
    set /a archivos_eliminados+=1
)

REM Limpiar archivos temporales
for %%f in (*.tmp *.log test_*.* temp_*.*) do (
    if exist "%%f" (
        del "%%f" >nul 2>&1
        echo ✅ Eliminado: %%f
        set /a archivos_eliminados+=1
    )
)

echo.
if %archivos_eliminados% gtr 0 (
    echo ✅ Limpieza completada: %archivos_eliminados% archivo(s) eliminado(s)
) else (
    echo ℹ️  No se encontraron archivos para limpiar
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:AYUDA
cls
echo.
echo ================================================================================
echo                              AYUDA Y DOCUMENTACIÓN
echo ================================================================================
echo.
echo 📚 SISTEMA DE LIMPIEZA DE ESQUEMAS DUPLICADOS EN SUPABASE
echo.
echo Este sistema está diseñado para limpiar esquemas duplicados en Supabase
echo de manera segura y controlada mediante un proceso de 2 pasos:
echo.
echo 🔹 PASO 1: CREAR BACKUP COMPLETO
echo   • Crea backup completo de la base de datos
echo   • Genera scripts de restauración
echo   • Documenta el proceso de backup
echo.
echo 🔹 PASO 2: VERIFICAR DATOS ÚNICOS
echo   • Verifica que el backup del PASO 1 existe
echo   • Analiza datos únicos vs duplicados
echo   • Genera reporte de verificación
echo   • Crea guía de interpretación
echo.
echo 🔹 TESTING EXHAUSTIVO
echo   • Verifica funcionalidad completa del sistema
echo   • Prueba casos edge y manejo de errores
echo   • Valida integración entre pasos
echo   • Genera reporte detallado de resultados
echo.
echo ================================================================================
echo                                  PREREQUISITOS
echo ================================================================================
echo.
echo ✅ REQUERIMIENTOS DEL SISTEMA:
echo   • Node.js instalado (versión 14 o superior)
echo   • Variables de entorno configuradas:
echo     - NEXT_PUBLIC_SUPABASE_URL
echo     - SUPABASE_SERVICE_ROLE_KEY
echo   • Permisos de escritura en el directorio
echo   • Conexión a internet para acceder a Supabase
echo.
echo ================================================================================
echo                                 FLUJO DE USO
echo ================================================================================
echo.
echo 1️⃣ EJECUTAR TESTING EXHAUSTIVO
echo    • Valida que todo el sistema funcione correctamente
echo    • Identifica problemas antes de usar en producción
echo.
echo 2️⃣ EJECUTAR PASO 1 - CREAR BACKUP
echo    • Solo después de que el testing sea exitoso
echo    • Crea backup completo de seguridad
echo.
echo 3️⃣ EJECUTAR PASO 2 - VERIFICAR DATOS
echo    • Solo después de completar PASO 1
echo    • Analiza datos únicos para limpieza segura
echo.
echo 4️⃣ PROCEDER CON LIMPIEZA
echo    • Solo si PASO 2 confirma que es seguro
echo    • Seguir recomendaciones del reporte
echo.
echo ================================================================================
echo                                   ARCHIVOS
echo ================================================================================
echo.
echo 📁 ARCHIVOS PRINCIPALES:
echo   • PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js
echo   • EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
echo   • PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js
echo   • EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat
echo   • TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js
echo.
echo 📁 ARCHIVOS GENERADOS:
echo   • BACKUP-COMPLETO-SUPABASE.sql
echo   • RESTAURAR-BACKUP-SUPABASE.sql
echo   • DOCUMENTACION-BACKUP.md
echo   • PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql
echo   • REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md
echo   • GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md
echo   • REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md
echo.
echo ================================================================================
echo                                   SOPORTE
echo ================================================================================
echo.
echo 🆘 EN CASO DE PROBLEMAS:
echo   1. Verificar prerequisitos del sistema
echo   2. Revisar reportes de error generados
echo   3. Verificar variables de entorno
echo   4. Comprobar conexión a Supabase
echo   5. Ejecutar como administrador si hay problemas de permisos
echo.
echo ⚠️  IMPORTANTE:
echo   • NUNCA ejecutar limpieza sin backup completo
echo   • SIEMPRE revisar reportes antes de proceder
echo   • MANTENER backups en lugar seguro
echo   • PROBAR en entorno de desarrollo primero
echo.
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
goto MENU

:SALIR
cls
echo.
echo ================================================================================
echo                    TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE
echo ================================================================================
echo.
echo 👋 Gracias por usar el sistema de testing exhaustivo
echo.
echo 💡 RECORDATORIO:
echo   • Ejecuta testing exhaustivo antes de usar el sistema en producción
echo   • Revisa siempre los reportes generados
echo   • Mantén backups seguros antes de cualquier limpieza
echo.
echo 🔒 SEGURIDAD:
echo   • Este sistema está diseñado para operaciones seguras
echo   • Siempre sigue el flujo: Testing → PASO 1 → PASO 2 → Limpieza
echo   • Nunca omitas los pasos de verificación
echo.
echo.
echo ¡Hasta la próxima! 🚀
echo.
pause
exit
