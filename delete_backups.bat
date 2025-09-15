@echo off
echo ============================================================
echo ELIMINADOR FORZADO DE CARPETA _BACKUPS - METODO DEFINITIVO
echo ============================================================

set FOLDER_NAME=_backups

echo.
echo Verificando si la carpeta existe...
if not exist "%FOLDER_NAME%" (
    echo ✅ La carpeta %FOLDER_NAME% no existe o ya fue eliminada
    goto :end
)

echo ⚠️  La carpeta %FOLDER_NAME% existe. Iniciando eliminacion forzada...
echo.

echo 🔄 Metodo 1: Eliminando atributos de solo lectura...
attrib -r -s -h "%FOLDER_NAME%\*.*" /s /d >nul 2>&1

echo 🔄 Metodo 2: Intentando eliminacion directa con rd...
rd /s /q "%FOLDER_NAME%" >nul 2>&1

if not exist "%FOLDER_NAME%" (
    echo ✅ Eliminacion exitosa con rd
    goto :success
)

echo 🔄 Metodo 3: Usando robocopy para vaciar la carpeta...
mkdir temp_empty_folder >nul 2>&1
robocopy temp_empty_folder "%FOLDER_NAME%" /mir /r:1 /w:1 /np /nfl /ndl /njh /njs >nul 2>&1
rd /s /q temp_empty_folder >nul 2>&1
rd /s /q "%FOLDER_NAME%" >nul 2>&1

if not exist "%FOLDER_NAME%" (
    echo ✅ Eliminacion exitosa con robocopy
    goto :success
)

echo 🔄 Metodo 4: Tomando propiedad con takeown...
takeown /f "%FOLDER_NAME%" /r /d y >nul 2>&1
icacls "%FOLDER_NAME%" /grant administrators:F /t >nul 2>&1
rd /s /q "%FOLDER_NAME%" >nul 2>&1

if not exist "%FOLDER_NAME%" (
    echo ✅ Eliminacion exitosa con takeown/icacls
    goto :success
)

echo 🔄 Metodo 5: Usando PowerShell como ultimo recurso...
powershell -Command "if (Test-Path '%FOLDER_NAME%') { Remove-Item -Path '%FOLDER_NAME%' -Recurse -Force -ErrorAction SilentlyContinue }" >nul 2>&1

if not exist "%FOLDER_NAME%" (
    echo ✅ Eliminacion exitosa con PowerShell
    goto :success
)

echo ❌ TODOS LOS METODOS FALLARON
echo 💡 Sugerencias:
echo    - Reinicia el sistema y vuelve a intentar
echo    - Verifica que no hay procesos usando archivos en la carpeta
echo    - Ejecuta como administrador
goto :end

:success
echo.
echo ============================================================
echo ✅ EXITO: La carpeta %FOLDER_NAME% ha sido eliminada completamente
echo ============================================================

:end
echo.
echo Verificacion final...
if exist "%FOLDER_NAME%" (
    echo ⚠️  ADVERTENCIA: La carpeta aun existe despues del proceso
) else (
    echo ✅ VERIFICADO: La carpeta ha sido eliminada correctamente
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
