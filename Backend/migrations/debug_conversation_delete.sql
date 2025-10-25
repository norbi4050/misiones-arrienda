-- =====================================================
-- DEBUG: Conversation Delete Issue
-- =====================================================
-- Run this to diagnose why conversations cannot be deleted
-- =====================================================

-- STEP 1: Get your current user ID
-- Run this while logged in to Supabase
SELECT
    auth.uid() as my_auth_uid,
    auth.uid()::text as my_auth_uid_text;

-- STEP 2: Check if you have a UserProfile
-- Replace '<YOUR_AUTH_UID>' with the result from STEP 1
SELECT
    id as my_profile_id,
    "userId" as my_auth_user_id,
    created_at
FROM user_profiles
WHERE "userId" = '<YOUR_AUTH_UID>';
-- Expected: Should return 1 row with your profile ID

-- STEP 3: Check your conversations
-- Replace '<YOUR_PROFILE_ID>' with the id from STEP 2
SELECT
    id as conversation_id,
    "aId" as participant_a,
    "bId" as participant_b,
    "isActive",
    CASE
        WHEN "aId" = '<YOUR_PROFILE_ID>' THEN 'You are participant A'
        WHEN "bId" = '<YOUR_PROFILE_ID>' THEN 'You are participant B'
        ELSE 'You are NOT a participant'
    END as your_role,
    "createdAt"
FROM "Conversation"
WHERE "aId" = '<YOUR_PROFILE_ID>' OR "bId" = '<YOUR_PROFILE_ID>'
ORDER BY "createdAt" DESC;

-- STEP 4: Test the DELETE policy logic manually
-- This simulates what the RLS policy does
-- Replace '<YOUR_AUTH_UID>' and '<CONVERSATION_ID_TO_DELETE>'
SELECT
    c.id as conversation_id,
    c."aId",
    c."bId",
    up.id as my_profile_id,
    up."userId" as my_auth_uid,
    CASE
        WHEN c."aId" IN (SELECT id FROM user_profiles WHERE "userId" = '<YOUR_AUTH_UID>')
             OR c."bId" IN (SELECT id FROM user_profiles WHERE "userId" = '<YOUR_AUTH_UID>')
        THEN 'DELETE ALLOWED ✓'
        ELSE 'DELETE BLOCKED ✗'
    END as policy_result
FROM "Conversation" c
CROSS JOIN user_profiles up
WHERE c.id = '<CONVERSATION_ID_TO_DELETE>'
  AND up."userId" = '<YOUR_AUTH_UID>';

-- STEP 5: Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('Conversation', 'Message', 'user_profiles');
-- Expected: rls_enabled should be TRUE for all

-- STEP 6: Verify the DELETE policy definition
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'Conversation'
  AND policyname = 'conversation_delete';

-- =====================================================
-- MANUAL DELETE TEST (use with caution)
-- =====================================================
-- This tests if you can delete as service role (bypasses RLS)
-- DO NOT RUN IN PRODUCTION - This is just for testing

-- First, try with RLS (as authenticated user):
-- SET ROLE authenticated;
-- DELETE FROM "Conversation" WHERE id = '<CONVERSATION_ID>' RETURNING *;

-- If that fails, try as service role (bypasses RLS):
-- RESET ROLE;
-- DELETE FROM "Conversation" WHERE id = '<CONVERSATION_ID>' RETURNING *;

-- =====================================================
-- EXPECTED ISSUE: auth.uid() might not be working
-- =====================================================
-- If auth.uid() returns NULL, the policy will fail
-- This can happen if:
-- 1. Not using Supabase client with proper auth
-- 2. Using admin/service role instead of authenticated role
-- 3. JWT token expired or invalid

-- Test auth.uid():
SELECT
    auth.uid() as current_auth_uid,
    current_user as current_postgres_role,
    session_user as session_user;

-- If auth.uid() is NULL, the RLS policies won't work!

-- =====================================================
-- ALTERNATIVE POLICY (if auth.uid() doesn't work)
-- =====================================================
-- If the problem is that auth.uid() is NULL from the backend,
-- we might need to use a service role or disable RLS for this table
-- (NOT RECOMMENDED for production)

-- Check current role:
-- SELECT current_user, session_user;
-- Expected: 'authenticated' or 'service_role'
