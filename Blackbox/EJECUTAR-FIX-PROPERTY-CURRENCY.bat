@echo off
echo ========================================
echo FIX PROPERTY CURRENCY COLUMN & POLICIES
echo ========================================
echo.

echo Ejecutando correccion de columna currency faltante y politicas RLS...
echo.

echo IMPORTANTE: Ejecuta manualmente el archivo SQL en Supabase SQL Editor:
echo Blackbox/SQL-FIX-PROPERTY-CURRENCY-AND-POLICIES.sql
echo.

echo El archivo contiene:
echo - Agregado de columna currency faltante
echo - Correccion de politicas RLS de Property (si existen)
echo - Consultas de verificacion
echo.

echo Despues de ejecutar el SQL, verifica en Supabase Dashboard que:
echo 1. No hay mas errores de columna currency
echo 2. Las politicas RLS de Property esten corregidas
echo.

pause
