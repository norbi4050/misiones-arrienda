-- =====================================================
-- FIX REMAINING AUTH_RLS_INITPLAN WARNINGS
-- Manual SQL to execute in Supabase SQL Editor
-- =====================================================

-- Based on current warnings, these policies still need fixing:
-- 1. favorites_delete_optimized_final
-- 2. property_inquiries_select_optimized_final
-- 3. property_inquiries_insert_optimized_final
-- 4. users_select_optimized_final
-- 5. property_inquiries_update_optimized_final
-- 6. users_insert_optimized_final
-- 7. property_inquiries_delete_optimized_final
-- 8. users_update_optimized_final
-- 9. users_delete_optimized_final
-- 10. favorites_select_optimized_final
-- 11. favorites_insert_optimized_final
-- 12. favorites_update_optimized_final

-- =====================================================
-- USERS POLICIES FIXES
-- =====================================================

-- Fix users_select_optimized_final
ALTER POLICY "users_select_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix users_insert_optimized_final
ALTER POLICY "users_insert_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix users_update_optimized_final
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

-- Fix users_delete_optimized_final
ALTER POLICY "users_delete_optimized_final" ON public.users
TO anon, authenticated, authenticator, dashboard_user
USING (
    id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- FAVORITES POLICIES FIXES
-- =====================================================

-- Fix favorites_select_optimized_final
ALTER POLICY "favorites_select_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix favorites_insert_optimized_final
ALTER POLICY "favorites_insert_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix favorites_update_optimized_final
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

-- Fix favorites_delete_optimized_final
ALTER POLICY "favorites_delete_optimized_final" ON public.favorites
TO anon, authenticated, authenticator, dashboard_user
USING (
    user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- PROPERTY_INQUIRIES POLICIES FIXES
-- =====================================================

-- Fix property_inquiries_select_optimized_final
ALTER POLICY "property_inquiries_select_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix property_inquiries_insert_optimized_final
ALTER POLICY "property_inquiries_insert_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
WITH CHECK (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- Fix property_inquiries_update_optimized_final
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

-- Fix property_inquiries_delete_optimized_final
ALTER POLICY "property_inquiries_delete_optimized_final" ON public.property_inquiries
TO anon, authenticated, authenticator, dashboard_user
USING (
    inquirer_user_id::text = (select auth.uid()::text) OR
    auth.role() = 'service_role'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that all policies were updated correctly
SELECT
    'VERIFICATION: ALL POLICIES UPDATED' as status,
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
-- - 12 policies updated with correct syntax
-- - 0 problematic policies remaining
-- - AUTH_RLS_INITPLAN warnings eliminated
-- =====================================================
