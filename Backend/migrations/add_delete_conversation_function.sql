-- =====================================================
-- ALTERNATIVE FIX: Create a PostgreSQL function to delete conversations
-- =====================================================
-- This function runs with SECURITY DEFINER which bypasses RLS
-- but includes proper authorization checks in the function logic
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS delete_conversation_for_user(uuid, text);

-- Create the function
CREATE OR REPLACE FUNCTION delete_conversation_for_user(
    p_conversation_id text,
    p_user_auth_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with owner's privileges (bypasses RLS)
SET search_path = public
AS $$
DECLARE
    v_user_profile_id text;
    v_conversation record;
    v_messages_deleted int;
    v_result jsonb;
BEGIN
    -- 1. Get the user's profile ID
    SELECT id INTO v_user_profile_id
    FROM user_profiles
    WHERE "userId" = p_user_auth_id;

    IF v_user_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_profile_not_found',
            'message', 'User profile not found'
        );
    END IF;

    -- 2. Get the conversation and verify user is a participant
    SELECT *
    INTO v_conversation
    FROM "Conversation"
    WHERE id = p_conversation_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'conversation_not_found',
            'message', 'Conversation not found'
        );
    END IF;

    -- 3. Check if user is a participant (aId or bId)
    IF v_conversation."aId" != v_user_profile_id
       AND v_conversation."bId" != v_user_profile_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'not_participant',
            'message', 'User is not a participant in this conversation'
        );
    END IF;

    -- 4. Delete messages first (cascade)
    DELETE FROM "Message"
    WHERE "conversationId" = p_conversation_id;

    GET DIAGNOSTICS v_messages_deleted = ROW_COUNT;

    -- 5. Delete the conversation
    DELETE FROM "Conversation"
    WHERE id = p_conversation_id;

    -- 6. Return success
    RETURN jsonb_build_object(
        'success', true,
        'conversation_id', p_conversation_id,
        'messages_deleted', v_messages_deleted,
        'deleted_at', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Handle any errors
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_conversation_for_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_conversation_for_user(text, text) TO service_role;

-- =====================================================
-- USAGE EXAMPLE
-- =====================================================
-- From backend API:
-- SELECT delete_conversation_for_user(
--     'conversation-id-here',
--     'user-auth-uid-here'
-- );

-- Expected success response:
-- {
--   "success": true,
--   "conversation_id": "cmgz696nd0001qsmvy411e3xz",
--   "messages_deleted": 5,
--   "deleted_at": "2025-01-25T..."
-- }

-- Expected error response (not participant):
-- {
--   "success": false,
--   "error": "not_participant",
--   "message": "User is not a participant in this conversation"
-- }

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================
-- Replace with actual values:
-- SELECT delete_conversation_for_user(
--     'cmgz696nd0001qsmvy411e3xz',  -- conversation ID
--     'user-auth-uid-here'            -- auth.users.id
-- );

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP FUNCTION IF EXISTS delete_conversation_for_user(text, text);
