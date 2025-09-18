-- =====================================================
-- FIX CRÍTICO CORREGIDO: Errores de Esquema Supabase 2025
-- =====================================================
-- Fecha: 15 de Enero 2025
-- Objetivo: Corregir todos los errores críticos con nombres correctos de tablas

-- =====================================================
-- 1. CORREGIR TRIGGER updated_at EN TABLA User
-- =====================================================

-- Verificar si existe la función de trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger existente si existe (para recrearlo correctamente)
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";

-- Crear trigger correcto para tabla User
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la columna updated_at existe en User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
