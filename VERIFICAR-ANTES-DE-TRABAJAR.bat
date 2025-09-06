@echo off
echo ================================================================
echo        VERIFICACION AUTOMATICA ANTES DE TRABAJAR
echo ================================================================
echo.
echo 🎯 Este script SIEMPRE debe ejecutarse antes de hacer cambios
echo    en Supabase para evitar romper el proyecto.
echo.
echo ⚠️  IMPORTANTE: No omitir esta verificacion nunca.
echo.
pause

echo.
echo 🔍 EJECUTANDO VERIFICACION COMPLETA DEL ESTADO...
echo ================================================================
cd Blackbox
node verificador-estado-supabase-automatico.js
echo.

echo.
echo 📋 MOSTRANDO ESTADO ACTUAL...
echo ================================================================
if exist "ESTADO-ACTUAL-SUPABASE.json" (
    echo ✅ Archivo de estado encontrado
    echo.
    echo 📊 RESUMEN RAPIDO:
    findstr "estadoGeneral" ESTADO-ACTUAL-SUPABASE.json
    findstr "error406" ESTADO-ACTUAL-SUPABASE.json
    findstr "habilitado" ESTADO-ACTUAL-SUPABASE.json
    echo.
) else (
    echo ❌ No se pudo generar archivo de estado
)

echo.
echo 📖 RECORDATORIOS IMPORTANTES:
echo ================================================================
echo.
echo ✅ ANTES DE CUALQUIER CAMBIO:
echo    1. Verificar que RLS este habilitado
echo    2. Confirmar que politicas estan activas
echo    3. Probar que error 406 sigue solucionado
echo    4. Verificar usuario de prueba funcional
echo.
echo ❌ NUNCA HACER:
echo    1. Eliminar politicas RLS sin crear nuevas
echo    2. Cambiar tipo de dato del campo 'id' (debe ser TEXT)
echo    3. Desactivar RLS en tabla users
echo    4. Eliminar usuario de prueba (ID: 6403f9d2-e846-4c70-87e0-e051127d9500)
echo.
echo 📋 ARCHIVOS DE REFERENCIA:
echo    - SUPABASE-DATABASE-SCHEMA.md (esquema completo)
echo    - PROTOCOLO-TRABAJO-EFICIENTE-SUPABASE.md (workflow)
echo    - ESTADO-ACTUAL-SUPABASE.json (estado actual)
echo.

echo.
echo 🎯 VERIFICACION COMPLETADA
echo ================================================================
echo.
echo ✅ Ahora puedes trabajar de manera segura
echo 💡 Recuerda: Siempre verificar despues de cambios tambien
echo.
echo 📞 Si algo falla, revisar PROTOCOLO-TRABAJO-EFICIENTE-SUPABASE.md
echo.
pause
