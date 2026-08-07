-- =============================================================================
-- Scaling baseline — lecture seule
--
-- À coller dans le SQL Editor (Supabase Dashboard) ou à exécuter en local.
-- Aucune requête ne modifie de données. Chaque bloc est indépendant :
-- exécuter un bloc à la fois pour lire son résultat.
--
-- Usage : relever ces mesures AVANT d'attaquer docs/scaling-roadmap.md, puis
-- après chaque sujet, pour comparer plutôt que deviner.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Plafond de lignes PostgREST  (sujet 3)
--
-- C'est la contrainte la plus importante de ce fichier : toute requête
-- applicative sans .limit() ni .range() est silencieusement tronquée à cette
-- valeur — pas d'erreur, juste des lignes manquantes.
--
-- Cette valeur n'est PAS lisible en SQL : PostgREST la reçoit par son
-- environnement (PGRST_DB_MAX_ROWS), pas par la base. Elle se lit :
--   - en local   : supabase/config.toml, clé `max_rows` (= 1000)
--   - en hébergé : Dashboard > Settings > API > Max rows
--
-- Pour l'observer réellement, interroger l'API avec un comptage exact et
-- comparer le nombre de lignes reçues au total annoncé par Content-Range.
-- Si `total` dépasse le nombre de lignes reçues, la réponse est tronquée :
--
--   curl -sS -I "$SUPABASE_URL/rest/v1/announcements?select=id" \
--     -H "apikey: $ANON_KEY" \
--     -H "Authorization: Bearer $ANON_KEY" \
--     -H "Prefer: count=exact" | grep -i content-range
--
--   # content-range: 0-999/4213  →  999 lignes reçues sur 4213 existantes
--
-- Le bloc ci-dessous donne le total côté base, à comparer au plafond lu
-- ci-dessus : toute table au-dessus du plafond est une source de troncature.
-- -----------------------------------------------------------------------------

SELECT 'announcements' AS table_name, count(*) AS lignes FROM public.announcements
UNION ALL SELECT 'initiatives',   count(*) FROM public.initiatives
UNION ALL SELECT 'events',        count(*) FROM public.events
UNION ALL SELECT 'memberships',   count(*) FROM public.memberships
UNION ALL SELECT 'profiles',      count(*) FROM public.profiles
UNION ALL SELECT 'messages',      count(*) FROM public.messages
UNION ALL SELECT 'notifications', count(*) FROM public.notifications
ORDER BY lignes DESC;


-- -----------------------------------------------------------------------------
-- 2. Clés étrangères sans index  (sujet 1)
--
-- Postgres n'indexe pas automatiquement les clés étrangères. Sans index, une
-- suppression en cascade (départ de commune, suppression de compte) fait un
-- parcours séquentiel de la table enfant, avec verrous à la clé.
--
-- Chaque ligne renvoyée est un index à créer.
-- -----------------------------------------------------------------------------

SELECT
  src.relname                                     AS table_enfant,
  con.conname                                     AS contrainte,
  string_agg(att.attname, ', ' ORDER BY att.attnum) AS colonnes_fk,
  tgt.relname                                     AS table_parente,
  pg_size_pretty(pg_relation_size(src.oid))       AS taille_table
FROM pg_constraint con
JOIN pg_class src ON src.oid = con.conrelid
JOIN pg_class tgt ON tgt.oid = con.confrelid
JOIN pg_namespace nsp ON nsp.oid = src.relnamespace
JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
JOIN pg_attribute att
  ON att.attrelid = src.oid AND att.attnum = k.attnum
WHERE con.contype = 'f'
  AND nsp.nspname = 'public'
  -- Aucun index dont les premières colonnes correspondent à la FK
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index idx
    WHERE idx.indrelid = con.conrelid
      AND (idx.indkey::int2[])[0:array_length(con.conkey, 1) - 1] = con.conkey
  )
GROUP BY src.relname, con.conname, tgt.relname, src.oid
ORDER BY pg_relation_size(src.oid) DESC, src.relname;


-- -----------------------------------------------------------------------------
-- 3. Index existants sur les tables sensibles  (sujet 1)
--
-- Sert de critère d'acceptation : relancer après la migration d'index et
-- vérifier que les nouveaux index apparaissent bien.
-- -----------------------------------------------------------------------------

SELECT
  tablename  AS table_name,
  indexname  AS index_name,
  indexdef   AS definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'announcements', 'initiatives', 'events',
    'memberships', 'profiles',
    'messages', 'conversations', 'conversation_participants',
    'notifications', 'push_subscriptions',
    'reports', 'moderation_actions',
    'initiative_responses', 'event_volunteers', 'event_participants',
    'email_queue', 'audit_logs', 'analytics_events'
  )
ORDER BY tablename, indexname;


-- -----------------------------------------------------------------------------
-- 4. Index jamais utilisés
--
-- idx_scan = 0 signifie que l'index n'a jamais servi depuis la dernière remise
-- à zéro des statistiques. Attention : un index récent, ou qui ne sert qu'à
-- garantir une contrainte d'unicité, apparaîtra ici sans être inutile.
-- -----------------------------------------------------------------------------

SELECT
  relname                              AS table_name,
  indexrelname                         AS index_name,
  idx_scan                             AS nb_utilisations,
  pg_size_pretty(pg_relation_size(indexrelid)) AS taille_index
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;


-- -----------------------------------------------------------------------------
-- 5. Volumétrie et croissance des tables  (sujet 8 — rétention)
--
-- Repérer les tables qui grossissent sans purge : notifications,
-- analytics_events, audit_logs, email_queue, messages.
-- -----------------------------------------------------------------------------

SELECT
  relname                                          AS table_name,
  n_live_tup                                       AS lignes_estimees,
  pg_size_pretty(pg_total_relation_size(relid))    AS taille_totale,
  pg_size_pretty(pg_relation_size(relid))          AS taille_donnees,
  pg_size_pretty(
    pg_total_relation_size(relid) - pg_relation_size(relid)
  )                                                AS taille_index,
  n_dead_tup                                       AS lignes_mortes,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;


-- -----------------------------------------------------------------------------
-- 6. Rétention : âge des lignes des tables append-only  (sujet 8)
--
-- Donne le volume purgeable avant d'écrire la politique de rétention.
-- -----------------------------------------------------------------------------

SELECT 'notifications' AS table_name,
       count(*)        AS total,
       count(*) FILTER (WHERE created_at < now() - interval '90 days')  AS plus_de_90j,
       min(created_at) AS plus_ancienne
FROM public.notifications
UNION ALL
SELECT 'analytics_events', count(*),
       count(*) FILTER (WHERE created_at < now() - interval '90 days'),
       min(created_at)
FROM public.analytics_events
UNION ALL
SELECT 'audit_logs', count(*),
       count(*) FILTER (WHERE created_at < now() - interval '90 days'),
       min(created_at)
FROM public.audit_logs
UNION ALL
SELECT 'email_queue', count(*),
       count(*) FILTER (WHERE created_at < now() - interval '30 days'),
       min(created_at)
FROM public.email_queue
UNION ALL
SELECT 'messages', count(*),
       count(*) FILTER (WHERE created_at < now() - interval '365 days'),
       min(created_at)
FROM public.messages;


-- -----------------------------------------------------------------------------
-- 7. Requêtes les plus coûteuses  (tous sujets)
--
-- Nécessite l'extension pg_stat_statements :
--   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
--
-- On trie par temps CUMULÉ, pas par temps moyen : une requête rapide appelée
-- des milliers de fois coûte plus cher qu'une requête lente appelée une fois.
-- -----------------------------------------------------------------------------

SELECT
  calls,
  round(total_exec_time::numeric)          AS temps_total_ms,
  round(mean_exec_time::numeric, 2)        AS temps_moyen_ms,
  rows                                    AS lignes_renvoyees,
  round(rows::numeric / greatest(calls, 1), 1) AS lignes_par_appel,
  left(query, 160)                        AS requete
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 25;


-- -----------------------------------------------------------------------------
-- 8. Requêtes qui rapatrient beaucoup de lignes  (sujets 3, 8, 9)
--
-- Un `lignes_par_appel` proche du plafond du bloc 1 est le signe d'une requête
-- tronquée : elle renvoie exactement max_rows alors qu'il en existe davantage.
-- -----------------------------------------------------------------------------

SELECT
  calls,
  rows                                         AS lignes_renvoyees,
  round(rows::numeric / greatest(calls, 1), 1) AS lignes_par_appel,
  round(total_exec_time::numeric)               AS temps_total_ms,
  left(query, 160)                             AS requete
FROM pg_stat_statements
WHERE calls > 0
  AND rows / greatest(calls, 1) > 200
ORDER BY rows DESC
LIMIT 25;


-- -----------------------------------------------------------------------------
-- 9. Taille du fan-out par commune  (sujets 3 et 4)
--
-- Nombre de membres actifs par commune = nombre de notifications générées par
-- publication. Au-delà du plafond du bloc 1, les membres excédentaires ne sont
-- pas notifiés du tout.
-- -----------------------------------------------------------------------------

SELECT
  c.name                                                     AS commune,
  c.access_status,
  count(m.id) FILTER (WHERE m.status = 'active')              AS membres_actifs,
  count(m.id)                                                 AS membres_total
FROM public.communes c
LEFT JOIN public.memberships m ON m.commune_id = c.id
GROUP BY c.id, c.name, c.access_status
ORDER BY membres_actifs DESC;
