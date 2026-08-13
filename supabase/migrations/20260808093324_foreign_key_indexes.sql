-- =============================================================================
-- Sujet 1 (scaling-roadmap.md) — Index sur les clés étrangères
--
-- Context:
-- Postgres does not automatically index foreign keys. Without indexes, any
-- DELETE that triggers ON DELETE CASCADE / SET NULL causes a sequential scan
-- on the child table, with locks held until verification completes.
--
-- Main trigger: auth.admin.deleteUser (called by performAccountDeletion in
-- lib/actions/account-deletion.ts) deletes rows in auth.users, forcing Postgres
-- to verify 19 FK constraints pointing to that table — each via seq scan today.
-- Same mechanism applies to memberships when a user leaves a commune.
--
-- Design decisions:
-- - All indexes are simple (single column), no partials, no composites.
-- - 18 of these indexes are on low-growth tables (staff activity, not user
--   growth). The planner will likely never use them — we create them anyway
--   for uniformity and so that the FK-without-index diagnostic (bloc 2 of
--   supabase/snippets/scaling-baseline.sql) returns only the 3 excluded
--   nomenclature FKs. DO NOT delete these indexes just because idx_scan = 0
--   in pg_stat_user_indexes.
-- - analytics_events.user_id is indexed despite the table being empty: the
--   analytics pipeline is scaffolding that was never wired; the index costs
--   nothing on an empty table and avoids revisiting later.
--
-- Excluded (roadmap rule — no index on nomenclature FK):
-- - announcements.category_slug → announcement_categories
-- - initiatives.category_slug → initiative_event_categories
-- - events.category_slug → initiative_event_categories
--
-- Measured before: bloc 2 returned 36 FK without index. After: 3 (the above).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FK → auth.users (19 indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_announcements_suspended_by
  ON public.announcements (suspended_by);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by_user
  ON public.conversations (created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a
  ON public.conversations (participant_a);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_b
  ON public.conversations (participant_b);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_sender
  ON public.conversations (last_message_sender_id);

CREATE INDEX IF NOT EXISTS idx_initiatives_suspended_by
  ON public.initiatives (suspended_by);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_profiles_banned_by
  ON public.profiles (banned_by);

CREATE INDEX IF NOT EXISTS idx_events_suspended_by
  ON public.events (suspended_by);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor_user
  ON public.moderation_actions (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_reports_restored_by_user
  ON public.reports (restored_by_user_id);

CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by_user
  ON public.reports (reviewed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_reviewed_by_user
  ON public.support_requests (reviewed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user
  ON public.analytics_events (user_id);

CREATE INDEX IF NOT EXISTS idx_banned_emails_banned_by
  ON public.banned_emails (banned_by);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_requested_by_user
  ON public.cancellation_requests (requested_by_user_id);

CREATE INDEX IF NOT EXISTS idx_commune_interest_leads_reviewed_by_user
  ON public.commune_interest_leads (reviewed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_reviewer_user
  ON public.moderation_appeals (reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_appellant_user
  ON public.moderation_appeals (appellant_user_id);

-- -----------------------------------------------------------------------------
-- FK → memberships (7 indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_content_outcomes_membership
  ON public.content_outcomes (membership_id);

CREATE INDEX IF NOT EXISTS idx_event_participants_membership
  ON public.event_participants (membership_id);

CREATE INDEX IF NOT EXISTS idx_event_volunteers_membership
  ON public.event_volunteers (membership_id);

CREATE INDEX IF NOT EXISTS idx_initiative_responses_membership
  ON public.initiative_responses (membership_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_membership
  ON public.reports (reporter_membership_id);

CREATE INDEX IF NOT EXISTS idx_neighbor_invites_inviter_membership
  ON public.neighbor_invites (inviter_membership_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_membership
  ON public.support_requests (membership_id);

-- -----------------------------------------------------------------------------
-- FK → communes (4 indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_active_commune
  ON public.profiles (active_commune_id);

CREATE INDEX IF NOT EXISTS idx_neighbor_invites_commune
  ON public.neighbor_invites (commune_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_commune
  ON public.support_requests (commune_id);

CREATE INDEX IF NOT EXISTS idx_commune_interest_leads_commune
  ON public.commune_interest_leads (commune_id);

-- -----------------------------------------------------------------------------
-- FK → reports (2 indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_moderation_actions_related_report
  ON public.moderation_actions (related_report_id);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_report
  ON public.moderation_appeals (report_id);

-- -----------------------------------------------------------------------------
-- FK → initiatives (1 index)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_events_source_initiative
  ON public.events (source_initiative_id);
