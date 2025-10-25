-- =====================================================
-- Migration: Add DELETE and UPDATE policies for Conversation
-- =====================================================
-- Problem: Users cannot delete or update their own conversations
-- Solution: Add RLS policies for DELETE and UPDATE operations
-- Date: 2025-01-25
-- =====================================================

-- 1. Add DELETE policy for Conversation table
-- Users can delete conversations where they are a participant (aId or bId)
DROP POLICY IF EXISTS conversation_delete ON public."Conversation";
CREATE POLICY conversation_delete ON public."Conversation"
FOR DELETE
USING (
    "aId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text) OR
    "bId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text)
);

-- 2. Add UPDATE policy for Conversation table
-- Users can update conversations where they are a participant
DROP POLICY IF EXISTS conversation_update ON public."Conversation";
CREATE POLICY conversation_update ON public."Conversation"
FOR UPDATE
USING (
    "aId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text) OR
    "bId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text)
)
WITH CHECK (
    "aId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text) OR
    "bId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text)
);

-- 3. Add DELETE policy for Message table (cascade deletes)
-- Users can delete messages in conversations where they are participants
DROP POLICY IF EXISTS message_delete ON public."Message";
CREATE POLICY message_delete ON public."Message"
FOR DELETE
USING (
    "conversationId" IN (
        SELECT id FROM public."Conversation"
        WHERE "aId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text)
           OR "bId" IN (SELECT id FROM public.user_profiles WHERE "userId" = auth.uid()::text)
    )
);

-- =====================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================

-- Check existing policies on Conversation
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'Conversation'
-- ORDER BY cmd;

-- Check existing policies on Message
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'Message'
-- ORDER BY cmd;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- DROP POLICY IF EXISTS conversation_delete ON public."Conversation";
-- DROP POLICY IF EXISTS conversation_update ON public."Conversation";
-- DROP POLICY IF EXISTS message_delete ON public."Message";
