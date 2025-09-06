-- =====================================================
-- FIX PROPERTY TABLE ISSUES - CURRENCY COLUMN & POLICIES
-- Manual SQL to execute in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ADD MISSING CURRENCY COLUMN
-- =====================================================

-- Add currency column to Property table
ALTER TABLE public.Property
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';

-- =====================================================
-- 2. FIX PROPERTY POLICIES (if they exist)
-- =====================================================

-- Check if Property policies exist and need fixing
-- These are the typical policies that might need the auth.uid() fix

-- Fix property_select policy (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'Property'
        AND policyname = 'property_select'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    ) THEN
        ALTER POLICY "property_select" ON public.Property
        TO anon, authenticated, authenticator, dashboard_user
        USING (
            userId::text = (select auth.uid()::text) OR
            agentId::text = (select auth.uid()::text) OR
            auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Fix property_insert policy (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'Property'
        AND policyname = 'property_insert'
        AND with_check LIKE '%auth.uid()%'
        AND with_check NOT LIKE '%(select auth.uid())%'
    ) THEN
        ALTER POLICY "property_insert" ON public.Property
        TO anon, authenticated, authenticator, dashboard_user
        WITH CHECK (
            userId::text = (select auth.uid()::text) OR
            agentId::text = (select auth.uid()::text) OR
            auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Fix property_update policy (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'Property'
        AND policyname = 'property_update'
        AND (
            (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') OR
            (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(select auth.uid())%')
        )
    ) THEN
        ALTER POLICY "property_update" ON public.Property
        TO anon, authenticated, authenticator, dashboard_user
        USING (
            userId::text = (select auth.uid()::text) OR
            agentId::text = (select auth.uid()::text) OR
            auth.role() = 'service_role'
        )
        WITH CHECK (
            userId::text = (select auth.uid()::text) OR
            agentId::text = (select auth.uid()::text) OR
            auth.role() = 'service_role'
        );
    END IF;
END $$;

-- Fix property_delete policy (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'Property'
        AND policyname = 'property_delete'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    ) THEN
        ALTER POLICY "property_delete" ON public.Property
        TO anon, authenticated, authenticator, dashboard_user
        USING (
            userId::text = (select auth.uid()::text) OR
            agentId::text = (select auth.uid()::text) OR
            auth.role() = 'service_role'
        );
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Check that currency column was added
SELECT
    'VERIFICATION: CURRENCY COLUMN ADDED' as status,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'Property'
    AND column_name = 'currency';

-- Check Property policies status
SELECT
    'VERIFICATION: PROPERTY POLICIES STATUS' as status,
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN 'PROBLEMATIC'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(select auth.uid())%' THEN 'PROBLEMATIC'
        ELSE 'OK'
    END as auth_uid_status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'Property'
ORDER BY policyname;

-- =====================================================
-- EXPECTED RESULTS:
-- - Currency column added successfully
-- - All Property policies fixed (if they existed)
-- - No problematic auth.uid() calls remaining
-- =====================================================
