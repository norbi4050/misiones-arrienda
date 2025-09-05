@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   PASO 2: VERIFICAR DATOS ÚNICOS
echo   SUPABASE - LIMPIEZA ESQUEMAS 2025
echo ========================================
echo.
echo 🔍 VERIFICACIÓN CRÍTICA: Este paso verifica que no
echo existan datos únicos en tablas duplicadas antes de
echo proceder con la limpieza.
echo.
echo ⚠️  PREREQUISITO: PASO 1 (Backup) debe estar completado
echo.
echo 📋 ESTE PASO INCLUYE:
echo ✓ Verificar existencia de tablas duplicadas
echo ✓ Contar registros en tablas principales y duplicadas
echo ✓ Identificar datos únicos que se perderían
echo ✓ Generar reporte detallado de verificación
echo ✓ Crear guía de interpretación de resultados
echo.

:MENU
echo ========================================
echo        MENÚ PASO 2 - VERIFICACIÓN
echo ========================================
echo.
echo 1. Ejecutar PASO 2 - Verificar datos únicos
echo 2. Ver información de la verificación
echo 3. Verificar prerequisitos (PASO 1)
echo 4. Ver guía de interpretación
echo 5. Abrir reporte de verificación (si existe)
echo 6. Salir
echo.
set /p opcion="Selecciona una opción (1-6): "

if "%opcion%"=="1" goto EJECUTAR_PASO_2
if "%opcion%"=="2" goto VER_INFO
if "%opcion%"=="3" goto VERIFICAR_PREREQUISITOS
if "%opcion%"=="4" goto VER_GUIA
if "%opcion%"=="5" goto ABRIR_REPORTE
if "%opcion%"=="6" goto SALIR
echo Opción inválida. Intenta de nuevo.
goto MENU

:EJECUTAR_PASO_2
echo.
echo ========================================
echo   EJECUTANDO PASO 2 - VERIFICACIÓN
echo ========================================
echo.
echo 🔍 Iniciando verificación de datos únicos...
echo.
echo IMPORTANTE: Este paso verifica que sea seguro
echo proceder con la limpieza de esquemas duplicados.
echo.
set /p confirmar="¿Continuar con la verificación? (S/n): "

if /i "%confirmar%"=="n" goto MENU

echo.
echo ⏳ Ejecutando PASO 2: Verificar datos únicos...
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

REM Ejecutar el PASO 2
node PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ PASO 2 COMPLETADO EXITOSAMENTE
    echo.
    echo 📄 Scripts de verificación generados:
    echo    ✓ PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql
    echo    ✓ REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md
    echo    ✓ GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md
    echo.
    echo 🔄 PRÓXIMOS PASOS OBLIGATORIOS:
    echo 1. Ejecutar el script SQL en Supabase Dashboard
    echo 2. Completar el reporte con los resultados
    echo 3. Revisar la guía de interpretación
    echo 4. SOLO proceder con PASO 3 si es SEGURO
    echo.
    set /p abrir_archivos="¿Abrir los archivos generados? (S/n): "
    if /i not "%abrir_archivos%"=="n" (
        echo.
        echo 📁 Abriendo archivos generados...
        if exist "PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql" (
            start "" "PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql"
        )
        if exist "REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md" (
            start "" "REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md"
        )
        if exist "GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md" (
            start "" "GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md"
        )
    )
    echo.
    echo 🚨 ADVERTENCIA CRÍTICA:
    echo NO proceder con PASO 3 hasta completar la verificación
    echo y confirmar que es SEGURO proceder.
    echo.
) else (
    echo.
    echo ❌ ERROR durante el PASO 2
    echo.
    echo 🚨 CRÍTICO: Sin verificación no se puede proceder
    echo con la limpieza de esquemas duplicados.
    echo.
    echo Revisa los mensajes de error anteriores y
    echo corrige los problemas antes de continuar.
    echo.
)

echo.
pause
goto MENU

:VER_INFO
echo.
echo ========================================
echo     INFORMACIÓN DE LA VERIFICACIÓN
echo ========================================
echo.
echo 🎯 OBJETIVO DE LA VERIFICACIÓN:
echo.
echo Identificar si existen datos únicos en las tablas
echo duplicadas (snake_case) que se perderían durante
echo la limpieza de esquemas.
echo.
echo 📊 QUÉ SE VERIFICA:
echo.
echo 🔍 EXISTENCIA DE TABLAS:
echo    ✓ users (duplicada de User)
echo    ✓ properties (duplicada de Property)
echo    ✓ agents (duplicada de Agent)
echo    ✓ favorites (duplicada de Favorite)
echo    ✓ conversations (duplicada de Conversation)
echo    ✓ messages (duplicada de Message)
echo.
echo 📈 CONTEO DE REGISTROS:
echo    ✓ Registros en tablas principales (PascalCase)
echo    ✓ Registros en tablas duplicadas (snake_case)
echo    ✓ Comparación entre ambas versiones
echo.
echo 🚨 DATOS ÚNICOS:
echo    ✓ Registros que solo existen en tablas duplicadas
echo    ✓ Datos que se perderían durante la limpieza
echo    ✓ Análisis de impacto por tabla
echo.
echo 🔐 VERIFICACIONES ADICIONALES:
echo    ✓ Foreign keys que podrían verse afectados
echo    ✓ Políticas RLS en tablas duplicadas
echo    ✓ Integridad referencial
echo.
echo 📋 RESULTADOS POSIBLES:
echo.
echo 🟢 SEGURO (0 datos únicos):
echo    → Proceder con PASO 3 (Limpieza)
echo.
echo 🟡 PRECAUCIÓN (pocos datos únicos):
echo    → Migrar datos únicos primero
echo    → Re-ejecutar verificación
echo    → Luego proceder con PASO 3
echo.
echo 🔴 PELIGRO (muchos datos únicos):
echo    → Análisis detallado requerido
echo    → NO proceder con limpieza
echo    → Consultar con equipo técnico
echo.
pause
goto MENU

:VERIFICAR_PREREQUISITOS
echo.
echo ========================================
echo      VERIFICAR PREREQUISITOS
echo ========================================
echo.
echo 🔍 Verificando prerequisitos del PASO 2...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js: INSTALADO
    for /f "tokens=*" %%i in ('node --version') do echo    Versión: %%i
) else (
    echo ❌ Node.js: NO INSTALADO
    echo    Requerido para ejecutar el script de verificación
)

echo.
echo 📋 PREREQUISITO CRÍTICO - PASO 1 (Backup):
echo.

REM Verificar directorios de backup
set backup_found=0
for /d %%i in (backup-supabase-*) do (
    if exist "%%i" (
        echo ✅ Directorio de backup encontrado: %%i
        set backup_found=1
        
        REM Verificar archivos críticos del backup
        if exist "%%i\BACKUP-COMPLETO-SUPABASE.sql" (
            echo    ✓ Script de backup SQL
        ) else (
            echo    ❌ Script de backup SQL faltante
        )
        
        if exist "%%i\RESTAURAR-BACKUP-SUPABASE.sql" (
            echo    ✓ Script de restauración
        ) else (
            echo    ❌ Script de restauración faltante
        )
        
        if exist "%%i\DOCUMENTACION-BACKUP.md" (
            echo    ✓ Documentación de backup
        ) else (
            echo    ❌ Documentación de backup faltante
        )
    )
)

if %backup_found%==0 (
    echo ❌ NO SE ENCONTRÓ BACKUP DEL PASO 1
    echo.
    echo 🚨 CRÍTICO: Debes ejecutar PASO 1 primero
    echo.
    echo Para ejecutar PASO 1:
    echo 1. Ejecuta: EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
    echo 2. Completa el backup exitosamente
    echo 3. Luego regresa a ejecutar PASO 2
    echo.
) else (
    echo.
    echo ✅ PASO 1 (Backup) completado correctamente
    echo 🚀 Listo para ejecutar PASO 2
)

echo.
echo 🔑 VARIABLES DE ENTORNO:
echo.
if defined NEXT_PUBLIC_SUPABASE_URL (
    echo ✅ NEXT_PUBLIC_SUPABASE_URL configurada
) else (
    echo ❌ NEXT_PUBLIC_SUPABASE_URL NO configurada
)

if defined SUPABASE_SERVICE_ROLE_KEY (
    echo ✅ SUPABASE_SERVICE_ROLE_KEY configurada
) else (
    echo ❌ SUPABASE_SERVICE_ROLE_KEY NO configurada
)

echo.
pause
goto MENU

:VER_GUIA
echo.
echo ========================================
echo       GUÍA DE INTERPRETACIÓN
echo ========================================
echo.
if exist "GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md" (
    echo 📖 Abriendo guía de interpretación...
    start "" "GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md"
    echo.
    echo La guía se ha abierto en tu editor predeterminado.
) else (
    echo ⚠️  La guía aún no ha sido generada.
    echo.
    echo Para generar la guía:
    echo 1. Ejecuta primero el PASO 2 (opción 1)
    echo 2. La guía se generará automáticamente
    echo.
    echo 📋 RESUMEN DE INTERPRETACIÓN:
    echo.
    echo 🟢 VERDE - SEGURO PARA LIMPIEZA:
    echo    • 0 datos únicos en todas las tablas
    echo    • Tablas duplicadas vacías o con duplicados exactos
    echo    • Acción: Proceder con PASO 3
    echo.
    echo 🟡 AMARILLO - PRECAUCIÓN:
    echo    • 1-10 datos únicos encontrados
    echo    • Datos únicos en tablas no críticas
    echo    • Acción: Migrar datos únicos, luego proceder
    echo.
    echo 🔴 ROJO - DETENER:
    echo    • Más de 10 datos únicos
    echo    • Datos únicos en tablas críticas
    echo    • Acción: Análisis detallado requerido
)

echo.
pause
goto MENU

:ABRIR_REPORTE
echo.
echo ========================================
echo        ABRIR REPORTE DE VERIFICACIÓN
echo ========================================
echo.
if exist "REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md" (
    echo 📋 Abriendo reporte de verificación...
    start "" "REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md"
    echo.
    echo El reporte se ha abierto en tu editor predeterminado.
    echo.
    echo 📝 INSTRUCCIONES PARA COMPLETAR EL REPORTE:
    echo.
    echo 1. Ejecuta el script SQL en Supabase Dashboard
    echo 2. Copia los resultados al reporte
    echo 3. Completa todas las secciones marcadas
    echo 4. Toma la decisión basada en los resultados
    echo.
    echo 🚨 IMPORTANTE:
    echo Solo procede con PASO 3 si el reporte indica
    echo que es SEGURO (0 datos únicos).
) else (
    echo ⚠️  El reporte aún no ha sido generado.
    echo.
    echo Para generar el reporte:
    echo 1. Ejecuta primero el PASO 2 (opción 1)
    echo 2. El reporte se generará automáticamente
    echo 3. Luego podrás abrirlo desde esta opción
)

echo.
pause
goto MENU

:SALIR
echo.
echo ========================================
echo              SALIENDO
echo ========================================
echo.
echo 📋 RECORDATORIO IMPORTANTE:
echo.
echo El PASO 2 es CRÍTICO para la seguridad de los datos.
echo.
echo ✅ SI YA COMPLETASTE EL PASO 2:
echo    • Revisa el reporte generado
echo    • Confirma que es seguro proceder
echo    • Solo entonces ejecuta PASO 3
echo.
echo ⚠️  SI AÚN NO COMPLETASTE EL PASO 2:
echo    • Ejecuta este script nuevamente
echo    • Completa la verificación
echo    • NO proceder sin verificar
echo.
echo 🔄 Para volver a ejecutar:
echo Ejecuta: EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat
echo.
pause
exit /b 0

:ERROR
echo.
echo ❌ Error durante la ejecución del PASO 2.
echo.
echo 🔍 POSIBLES CAUSAS:
echo • PASO 1 (Backup) no completado
echo • Variables de entorno no configuradas
echo • Node.js no instalado
echo • Problemas de permisos
echo.
echo 📋 SOLUCIONES:
echo 1. Verificar prerequisitos (opción 3)
echo 2. Completar PASO 1 si es necesario
echo 3. Configurar variables de entorno
echo 4. Instalar Node.js si es necesario
echo.
pause
exit /b 1
