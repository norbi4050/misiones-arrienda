-- Fix User table RLS policies for permission denied errors
-- This script addresses the "permission denied for table User" error

-- First, check if RLS is enabled on the User table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'User' AND schemaname = 'public';

-- Enable RLS on User table if not already enabled
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public."User";

-- Create comprehensive RLS policies for User table

-- 1. Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public."User"
    FOR SELECT USING (auth.uid() = id::uuid);

-- 2. Allow users to insert their own profile (for profile creation)
CREATE POLICY "Users can insert own profile" ON public."User"
    FOR INSERT WITH CHECK (auth.uid() = id::uuid);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public."User"
    FOR UPDATE USING (auth.uid() = id::uuid);

-- 4. Allow service role to bypass RLS (for administrative operations)
CREATE POLICY "Service role can manage all profiles" ON public."User"
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public."User" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."User" TO anon;

-- Grant full permissions to service role
GRANT ALL ON public."User" TO service_role;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'User' AND schemaname = 'public'
ORDER BY policyname;

-- Check table permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY grantee, privilege_type;
