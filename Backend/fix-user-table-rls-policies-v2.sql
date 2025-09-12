-- Fix User table RLS policies for permission denied errors
-- This script addresses the "permission denied for table User" error

-- First, check if RLS is enabled on User table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'User' AND schemaname = 'public';

-- Enable RLS on User table if not already enabled
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Service role can manage all users" ON public."User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public."User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public."User";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public."User";

-- Create comprehensive RLS policies for User table

-- 1. Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile" ON public."User"
    FOR SELECT 
    USING (auth.uid()::text = id);

-- 2. Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public."User"
    FOR INSERT 
    WITH CHECK (auth.uid()::text = id);

-- 3. Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public."User"
    FOR UPDATE 
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- 4. Allow service role to bypass RLS (for administrative operations)
CREATE POLICY "Service role can manage all users" ON public."User"
    FOR ALL
    USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- 5. Fallback policy for authenticated users (more permissive)
CREATE POLICY "Enable read access for authenticated users" ON public."User"
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 6. Allow profile creation for any authenticated user
CREATE POLICY "Enable insert for authenticated users" ON public."User"
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 7. Allow profile updates for authenticated users on their own data
CREATE POLICY "Enable update for users based on user_id" ON public."User"
    FOR UPDATE 
    USING (auth.role() = 'authenticated' AND auth.uid()::text = id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public."User" TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON public."User" TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'User' AND schemaname = 'public'
ORDER BY policyname;

-- Test query to verify permissions (should not fail)
-- This will be executed by the application, not directly in SQL
-- SELECT id, name, email FROM public."User" WHERE id = auth.uid()::text LIMIT 1;

COMMIT;
