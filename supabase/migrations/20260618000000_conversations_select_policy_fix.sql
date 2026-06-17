-- Fix conversations INSERT blocked by SELECT RLS
--
-- PostgreSQL also evaluates SELECT policies on INSERT: the new row must be
-- visible to the inserter. Our flow inserts the conversation first, then
-- conversation_participants rows in a second statement. Until participants
-- exist, is_conversation_participant(id) is false and the insert is rejected.
--
-- participant_a / participant_b are denormalized on conversations for
-- idempotent upsert; use them (and created_by_user_id) for SELECT access.

BEGIN;

DROP POLICY IF EXISTS conversations_select ON public.conversations;

CREATE POLICY conversations_select ON public.conversations FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_conversation_participant(id)
  OR created_by_user_id = auth.uid()
  OR auth.uid() = participant_a
  OR auth.uid() = participant_b
);

COMMIT;
