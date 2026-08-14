-- Subject 9 phase 3c: wrap auth.uid() in messaging RLS policies.

DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_conversation_participant(id)
  OR created_by_user_id = (select auth.uid())
  OR (select auth.uid()) = participant_a
  OR (select auth.uid()) = participant_b
);

DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT
WITH CHECK (
  (select auth.uid()) = created_by_user_id
  AND public.can_access_commune_content(commune_id)
);

DROP POLICY IF EXISTS conversation_participants_update_self ON public.conversation_participants;
CREATE POLICY conversation_participants_update_self ON public.conversation_participants FOR UPDATE
USING (user_id = (select auth.uid()) OR public.is_platform_admin())
WITH CHECK (user_id = (select auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS conversation_participants_update ON public.conversation_participants;
CREATE POLICY conversation_participants_update ON public.conversation_participants FOR UPDATE
USING (public.is_platform_admin() OR user_id = (select auth.uid()))
WITH CHECK (public.is_platform_admin() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS conversation_participants_delete ON public.conversation_participants;
CREATE POLICY conversation_participants_delete ON public.conversation_participants FOR DELETE
USING (
  public.is_platform_admin()
  OR user_id = (select auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.created_by_user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages FOR INSERT
WITH CHECK (
  sender_id = (select auth.uid())
  AND public.is_conversation_participant(conversation_id)
);

DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages FOR UPDATE
USING (
  sender_id = (select auth.uid())
  AND public.is_conversation_participant(conversation_id)
);

DROP POLICY IF EXISTS messages_delete ON public.messages;
CREATE POLICY messages_delete ON public.messages FOR DELETE
USING (
  sender_id = (select auth.uid())
  AND public.is_conversation_participant(conversation_id)
);
