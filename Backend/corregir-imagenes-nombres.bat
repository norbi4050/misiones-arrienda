@echo off
echo Corrigiendo nombres de imagenes...

cd public

if exist "placeholder-apartment-1.jpg.jpg" (
    copy "placeholder-apartment-1.jpg.jpg" "placeholder-apartment-1.jpg"
    echo Copiado placeholder-apartment-1.jpg
)

if exist "placeholder-apartment-2.jpg.jpg" (
    copy "placeholder-apartment-2.jpg.jpg" "placeholder-apartment-2.jpg"
    echo Copiado placeholder-apartment-2.jpg
)

if exist "placeholder-apartment-3.jpg.jpg" (
    copy "placeholder-apartment-3.jpg.jpg" "placeholder-apartment-3.jpg"
    echo Copiado placeholder-apartment-3.jpg
)

if exist "placeholder-house-1.jpg.jpg" (
    copy "placeholder-house-1.jpg.jpg" "placeholder-house-1.jpg"
    echo Copiado placeholder-house-1.jpg
)

if exist "placeholder-house-2 - copia.jpg" (
    copy "placeholder-house-2 - copia.jpg" "placeholder-house-2.jpg"
    echo Copiado placeholder-house-2.jpg
)

echo.
echo Imagenes corregidas!
dir *.jpg
pause
