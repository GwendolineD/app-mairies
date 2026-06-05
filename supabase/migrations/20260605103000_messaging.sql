-- =============================================================================
-- Messaging feature: activity bump + notification fan-out, context-scoped
-- conversation upsert RPC, web push subscriptions, realtime publication.
-- Conversation identity = (context_type, context_id, pair of participants):
--   one thread per neighbour AND per announcement / initiative / event.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. On new message: bump the parent conversation activity timestamp and
--    fan out an in-app notification to every other participant.
--    SECURITY DEFINER so the insert into notifications bypasses the
--    "no client INSERT" policy while staying scoped to real participants.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_message ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name text;
  v_preview text;
BEGIN
  UPDATE public.conversations
    SET updated_at = now ()
    WHERE id = NEW.conversation_id;

  SELECT coalesce(
           p.display_name,
           nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
           'Un·e voisin·e'
         )
    INTO v_sender_name
    FROM public.profiles p
    WHERE p.user_id = NEW.sender_id;

  v_preview := left(NEW.body, 140);

  INSERT INTO public.notifications (user_id, title, body, payload)
  SELECT
    cp.user_id,
    coalesce(v_sender_name, 'Nouveau message'),
    v_preview,
    jsonb_build_object(
      'type', 'message',
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id <> NEW.sender_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_after_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message ();

-- -----------------------------------------------------------------------------
-- 2. Idempotent, concurrency-safe conversation resolver.
--    Resolves the content author server-side (never trusts the client) and
--    returns the existing thread for this (context, me, author) tuple or
--    creates it. An advisory lock serialises the "first contact" race.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_context_conversation (
  p_context_type public.context_type,
  p_context_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid ();
  v_commune uuid;
  v_author uuid;
  v_title text;
  v_conv uuid;
  v_lock_key bigint;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF p_context_type = 'announcement' THEN
    SELECT a.commune_id, m.user_id, a.title
      INTO v_commune, v_author, v_title
      FROM public.announcements a
      JOIN public.memberships m ON m.id = a.author_membership_id
      WHERE a.id = p_context_id;
  ELSIF p_context_type = 'initiative' THEN
    SELECT i.commune_id, m.user_id, i.title
      INTO v_commune, v_author, v_title
      FROM public.initiatives i
      JOIN public.memberships m ON m.id = i.author_membership_id
      WHERE i.id = p_context_id;
  ELSIF p_context_type = 'event' THEN
    SELECT e.commune_id, m.user_id, e.title
      INTO v_commune, v_author, v_title
      FROM public.events e
      JOIN public.memberships m ON m.id = e.author_membership_id
      WHERE e.id = p_context_id;
  END IF;

  IF v_commune IS NULL THEN
    RAISE EXCEPTION 'CONTENT_NOT_FOUND';
  END IF;

  IF NOT public.has_active_membership (v_commune) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  IF v_author = v_user THEN
    RAISE EXCEPTION 'CANNOT_CONTACT_SELF';
  END IF;

  v_lock_key := hashtextextended (
    p_context_type::text || ':' || p_context_id::text || ':' ||
    least(v_user, v_author)::text || ':' || greatest(v_user, v_author)::text,
    0
  );
  PERFORM pg_advisory_xact_lock (v_lock_key);

  SELECT c.id
    INTO v_conv
    FROM public.conversations c
    WHERE c.context_type = p_context_type
      AND c.context_id = p_context_id
      AND EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = c.id AND p.user_id = v_user
      )
      AND EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = c.id AND p.user_id = v_author
      )
    LIMIT 1;

  IF v_conv IS NOT NULL THEN
    RETURN v_conv;
  END IF;

  INSERT INTO public.conversations (commune_id, created_by_user_id, context_type, context_id, title)
  VALUES (v_commune, v_user, p_context_type, p_context_id, v_title)
  RETURNING id INTO v_conv;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conv, v_user), (v_conv, v_author);

  RETURN v_conv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_context_conversation (public.context_type, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Web push subscriptions (PWA mobile notifications). One row per device
--    endpoint; users only ever see / manage their own.
-- -----------------------------------------------------------------------------
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions (user_id);

CREATE TRIGGER trg_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subscriptions_select ON public.push_subscriptions FOR SELECT
USING (public.is_platform_admin () OR user_id = auth.uid ());

CREATE POLICY push_subscriptions_insert ON public.push_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid ());

CREATE POLICY push_subscriptions_update ON public.push_subscriptions FOR UPDATE
USING (user_id = auth.uid ())
WITH CHECK (user_id = auth.uid ());

CREATE POLICY push_subscriptions_delete ON public.push_subscriptions FOR DELETE
USING (public.is_platform_admin () OR user_id = auth.uid ());

-- -----------------------------------------------------------------------------
-- 4. Realtime: expose messaging + notifications so RLS-filtered postgres_changes
--    can drive live thread updates, list re-ordering and notification toasts.
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
