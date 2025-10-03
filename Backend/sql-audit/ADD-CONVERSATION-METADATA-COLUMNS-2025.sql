-- ============================================
-- ADD CONVERSATION METADATA COLUMNS
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Agregar columnas para almacenar metadatos de conversación
--           (last_message_text, last_message_at) para evitar cálculos
--           costosos en cada request
-- 
-- IMPORTANTE: Este script es idempotente y safe para ejecutar múltiples veces
-- ============================================

-- 1. Agregar columna last_message_text si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'conversations' 
      AND column_name = 'last_message_text'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_message_text TEXT;
    
    RAISE NOTICE '✅ Columna last_message_text agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna last_message_text ya existe';
  END IF;
END $$;

-- 2. Agregar columna last_message_at si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'conversations' 
      AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE '✅ Columna last_message_at agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna last_message_at ya existe';
  END IF;
END $$;

-- 3. Asegurar que updated_at existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'conversations' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE '✅ Columna updated_at agregada';
  ELSE
    RAISE NOTICE '⚠️ Columna updated_at ya existe';
  END IF;
END $$;

-- ============================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ============================================
-- Poblar last_message_text y last_message_at con datos de mensajes existentes

DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Actualizar conversaciones con el último mensaje
  UPDATE conversations c
  SET 
    last_message_text = (
      SELECT m.body 
      FROM messages m 
      WHERE m.conversation_id = c.id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ),
    last_message_at = (
      SELECT m.created_at 
      FROM messages m 
      WHERE m.conversation_id = c.id 
      ORDER BY m.created_at DESC 
      LIMIT 1
    ),
    updated_at = COALESCE(
      (
        SELECT m.created_at 
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY m.created_at DESC 
        LIMIT 1
      ),
      c.updated_at,
      c.created_at
    )
  WHERE EXISTS (
    SELECT 1 FROM messages m 
    WHERE m.conversation_id = c.id
  );
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE '✅ Migración completada: % conversaciones actualizadas', rows_updated;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Mostrar estadísticas de la migración

DO $$
DECLARE
  total_conversations INTEGER;
  with_last_message INTEGER;
  without_last_message INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_conversations FROM conversations;
  
  SELECT COUNT(*) INTO with_last_message 
  FROM conversations 
  WHERE last_message_text IS NOT NULL;
  
  SELECT COUNT(*) INTO without_last_message 
  FROM conversations 
  WHERE last_message_text IS NULL;
  
  RAISE NOTICE '📊 Estadísticas:';
  RAISE NOTICE '   Total conversaciones: %', total_conversations;
  RAISE NOTICE '   Con último mensaje: %', with_last_message;
  RAISE NOTICE '   Sin último mensaje: %', without_last_message;
END $$;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
-- Crear índices si no existen para mejorar queries

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at 
ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
ON conversations(updated_at DESC);

RAISE NOTICE '✅ Índices creados/verificados';

-- ============================================
-- NOTAS DE EJECUCIÓN
-- ============================================
-- 
-- Para ejecutar este script en Supabase:
-- 1. Ir a SQL Editor en Supabase Dashboard
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar (Run)
-- 4. Verificar los mensajes de NOTICE en la consola
-- 
-- El script es seguro para ejecutar múltiples veces (idempotente)
-- No elimina datos existentes
-- No modifica RLS policies
-- No afecta a usuarios conectados
-- 
-- ============================================
