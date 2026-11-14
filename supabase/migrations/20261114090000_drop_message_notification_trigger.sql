-- =============================================================================
-- Fix: sending a message fails with
--   null value in column "commune_id" of relation "notifications"
--
-- Root cause: trg_messages_after_insert (handle_new_message) still inserted a
-- notifications row per recipient without commune_id, but
-- 20261008210000_notifications_center.sql made notifications.commune_id NOT NULL
-- and removed messages from the notification center (unread conversations are
-- surfaced by the inbox; push is sent by the server action).
--
-- The trigger is obsolete: conversation activity is already maintained by
-- trg_messages_update_conversation (update_conversation_on_message_insert).
-- =============================================================================

DROP TRIGGER IF EXISTS trg_messages_after_insert ON public.messages;
DROP FUNCTION IF EXISTS public.handle_new_message ();
