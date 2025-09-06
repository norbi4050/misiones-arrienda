-- =====================================================
-- SOLUCIÓN COMPLETA PARA PROBLEMAS ACTUALES
-- AUTH_RLS_INITPLAN WARNINGS + COLUMNA CURRENCY FALTANTE
-- Manual SQL to execute in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ADD MISSING CURRENCY COLUMN TO PROPERTY TABLE
-- =====================================================

-- Add currency column to Property table
ALTER TABLE public.Property
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- =====================================================
-- 2. FIX REMAINING AUTH_RLS_INITPLAN WARNINGS
-- =====================================================

-- Fix remaining problematic policies in users, favorites, property_inquiries tables

-- USERS POLICIES
ALTER POLICY "users_select_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "users_insert_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "users_update_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "users_delete_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- FAVORITES POLICIES
ALTER POLICY "favorites_select_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "favorites_insert_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "favorites_update_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "favorites_delete_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- PROPERTY_INQUIRIES POLICIES
ALTER POLICY "property_inquiries_select_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "property_inquiries_insert_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "property_inquiries_update_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

ALTER POLICY "property_inquiries_delete_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- 3. FIX PROPERTY POLICIES (if they exist)
-- =====================================================

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
-- 4. VERIFICATION QUERIES
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

-- Check for any remaining problematic policies
SELECT
    'VERIFICATION: REMAINING PROBLEMATIC POLICIES' as status,
    COUNT(*) as problematic_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'favorites', 'property_inquiries', 'Property')
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') OR
        (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(select auth.uid())%')
    );

-- Check all policies status
SELECT
    'VERIFICATION: ALL POLICIES STATUS' as status,
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
    AND tablename IN ('users', 'favorites', 'property_inquiries', 'Property')
ORDER BY tablename, policyname;

-- =====================================================
-- EXPECTED RESULTS:
-- - Currency column added to Property table
-- - All AUTH_RLS_INITPLAN warnings eliminated
-- - All policies use correct (select auth.uid()) syntax
-- - No problematic policies remaining
-- =====================================================
