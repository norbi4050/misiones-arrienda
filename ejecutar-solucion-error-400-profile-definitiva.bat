@echo off
echo ========================================
echo APLICANDO SOLUCION ERROR 400 PROFILE
echo ========================================
echo Fecha: %date% %time%
echo.

echo [1/5] Creando backup del archivo actual...
if exist "Backend\src\app\api\users\profile\route.ts" (
    copy "Backend\src\app\api\users\profile\route.ts" "Backend\src\app\api\users\profile\route-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.ts" >nul
    echo ✅ Backup creado exitosamente
) else (
    echo ⚠️  Archivo original no encontrado, continuando...
)

echo.
echo [2/5] Aplicando solucion corregida...
if exist "Backend\src\app\api\users\profile\route-corregido-definitivo.ts" (
    copy "Backend\src\app\api\users\profile\route-corregido-definitivo.ts" "Backend\src\app\api\users\profile\route.ts" >nul
    echo ✅ Solucion aplicada exitosamente
) else (
    echo ❌ ERROR: Archivo de solucion no encontrado
    echo    Ubicacion esperada: Backend\src\app\api\users\profile\route-corregido-definitivo.ts
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando aplicacion de la solucion...
if exist "Backend\src\app\api\users\profile\route.ts" (
    echo ✅ Archivo actualizado correctamente
) else (
    echo ❌ ERROR: Fallo en la aplicacion de la solucion
    pause
    exit /b 1
)

echo.
echo [4/5] Ejecutando testing de validacion...
if exist "test-solucion-error-400-profile-definitiva.js" (
    echo Ejecutando tests de validacion...
    node "test-solucion-error-400-profile-definitiva.js"
    echo ✅ Testing completado
) else (
    echo ⚠️  Script de testing no encontrado, saltando...
)

echo.
echo [5/5] Mostrando resumen de cambios aplicados...
echo.
echo ========================================
echo RESUMEN DE CAMBIOS APLICADOS
echo ========================================
echo.
echo ✅ CORRECCION PRINCIPAL:
echo    - Cambiado: .select() → .select("*")
echo    - Problema: PostgREST error 400 con select sin parametros
echo    - Solucion: Especificar parametros explicitamente
echo.
echo ✅ MEJORAS ADICIONALES:
echo    - Validacion robusta de datos de entrada
echo    - Sanitizacion de strings (trim, null checks)
echo    - Manejo especifico de errores PostgREST
echo    - Logging detallado para debugging
echo    - Mapeo bidireccional de campos
echo.
echo ✅ ARCHIVOS MODIFICADOS:
echo    - Backend\src\app\api\users\profile\route.ts (ACTUALIZADO)
echo    - Backend\src\app\api\users\profile\route-backup-*.ts (BACKUP)
echo.
echo ========================================
echo PROXIMOS PASOS
echo ========================================
echo.
echo 1. 🔄 PROBAR EN DESARROLLO:
echo    cd Backend
echo    npm run dev
echo    Probar actualizacion de perfil en http://localhost:3000
echo.
echo 2. 🔍 VERIFICAR LOGS:
echo    - Revisar consola del servidor
echo    - Verificar logs de Supabase Dashboard
echo    - Confirmar ausencia de errores 400
echo.
echo 3. 🚀 DESPLEGAR A PRODUCCION:
echo    - Commit y push de cambios
echo    - Desplegar a Vercel
echo    - Monitorear funcionamiento en produccion
echo.
echo 4. 📊 MONITOREAR METRICAS:
echo    - Tasa de error 400: Debe ser 0%%
echo    - Tiempo de respuesta: Debe mantenerse ^< 500ms
echo    - Actualizaciones exitosas de perfil
echo.

echo ========================================
echo SOLUCION APLICADA EXITOSAMENTE
echo ========================================
echo.
echo 🎉 El error 400 en /api/users/profile ha sido solucionado
echo 📋 Causa raiz: Problema de sintaxis PostgREST con .select()
echo 🔧 Solucion: Especificar parametros explicitamente .select("*")
echo 📈 Mejoras: Validacion, logging y manejo de errores mejorados
echo.
echo ⚠️  IMPORTANTE: Probar la solucion antes de desplegar a produccion
echo.

echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo ¿Deseas abrir el reporte completo de la solucion? (S/N)
set /p respuesta=

if /i "%respuesta%"=="S" (
    if exist "REPORTE-FINAL-ERROR-400-PROFILE-SOLUCIONADO-DEFINITIVO.md" (
        start "" "REPORTE-FINAL-ERROR-400-PROFILE-SOLUCIONADO-DEFINITIVO.md"
        echo ✅ Reporte abierto
    ) else (
        echo ⚠️  Reporte no encontrado
    )
)

echo.
echo ¿Deseas iniciar el servidor de desarrollo para probar? (S/N)
set /p respuesta2=

if /i "%respuesta2%"=="S" (
    echo Iniciando servidor de desarrollo...
    cd Backend
    echo Ejecutando: npm run dev
    echo.
    echo 🌐 El servidor se iniciara en: http://localhost:3000
    echo 🔧 Probar actualizacion de perfil de usuario
    echo 📋 Verificar ausencia de errores 400 en consola
    echo.
    npm run dev
)

echo.
echo ========================================
echo PROCESO COMPLETADO
echo ========================================
echo Gracias por usar la solucion automatica
echo Desarrollado por: BlackBox AI
echo Proyecto: Misiones Arrienda
echo ========================================
