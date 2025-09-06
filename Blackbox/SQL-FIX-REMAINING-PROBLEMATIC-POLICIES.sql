-- =====================================================
-- FIX REMAINING PROBLEMATIC POLICIES
-- =====================================================
-- Based on user feedback: 9 policies still have auth.uid() without (select ...)
-- This script targets only the remaining problematic policies
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- =====================================================

-- Drop all policies for the three tables
DROP POLICY IF EXISTS "users_select_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_insert_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_update_optimized_final" ON public.users;
DROP POLICY IF EXISTS "users_delete_optimized_final" ON public.users;

DROP POLICY IF EXISTS "favorites_select_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_update_optimized_final" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_optimized_final" ON public.favorites;

DROP POLICY IF EXISTS "property_inquiries_select_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_insert_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_update_optimized_final" ON public.property_inquiries;
DROP POLICY IF EXISTS "property_inquiries_delete_optimized_final" ON public.property_inquiries;

-- =====================================================
-- STEP 2: RECREATE ALL POLICIES WITH CORRECT SYNTAX
-- =====================================================

-- USERS POLICIES
CREATE POLICY "users_select_optimized_final" ON public.users
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_insert_optimized_final" ON public.users
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_update_optimized_final" ON public.users
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "users_delete_optimized_final" ON public.users
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- FAVORITES POLICIES
CREATE POLICY "favorites_select_optimized_final" ON public.favorites
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_insert_optimized_final" ON public.favorites
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_update_optimized_final" ON public.favorites
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "favorites_delete_optimized_final" ON public.favorites
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- PROPERTY_INQUIRIES POLICIES
CREATE POLICY "property_inquiries_select_optimized_final" ON public.property_inquiries
FOR SELECT TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_insert_optimized_final" ON public.property_inquiries
FOR INSERT TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_update_optimized_final" ON public.property_inquiries
FOR UPDATE TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
)
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

CREATE POLICY "property_inquiries_delete_optimized_final" ON public.property_inquiries
FOR DELETE TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

-- Check that all policies were created correctly
SELECT
    'VERIFICATION: ALL POLICIES CREATED' as status,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'favorites', 'property_inquiries')
    AND policyname LIKE '%_optimized_final'
ORDER BY tablename, policyname;

-- Check for any remaining problematic policies
SELECT
    'VERIFICATION: REMAINING PROBLEMATIC POLICIES' as status,
    COUNT(*) as problematic_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'favorites', 'property_inquiries')
    AND qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(select auth.uid())%';

-- =====================================================
-- EXPECTED RESULTS:
-- - 12 policies created with correct syntax
-- - 0 problematic policies remaining
-- - AUTH_RLS_INITPLAN warnings eliminated
-- =====================================================
