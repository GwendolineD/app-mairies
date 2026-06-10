-- =============================================================================
-- Allow a participant to update their own conversation_participants row
-- (read receipts: last_read_at). Without this UPDATE policy, RLS silently
-- blocks marking conversations as read, so unread counts never reset.
-- =============================================================================

CREATE POLICY conversation_participants_update ON public.conversation_participants
FOR UPDATE
USING (public.is_platform_admin () OR user_id = auth.uid ())
WITH CHECK (public.is_platform_admin () OR user_id = auth.uid ());
