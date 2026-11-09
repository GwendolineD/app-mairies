# Centre de notifications in-app

> Décision prise le 10 août 2026 : **Option A retenue** — cloche dans le header résident.
> Statut : **livré le 8 octobre 2026** (migration `20261008210000_notifications_center.sql`).

---

## Contexte

La table `notifications` était alimentée par le fan-out et par `notifyUser`, mais aucun code ne la lisait : les push Web étaient le seul canal visible, non fiable (Safari, Firefox, politiques entreprise). Le centre de notifications rend ce flux consultable dans l'app, scopé par commune.

---

## Modèle de données

| Colonne | Rôle |
|---------|------|
| `commune_id` **NOT NULL** | Tenant : toute lecture/écriture est filtrée par commune active. Aucune notification « globale ». |
| `kind` | `new_content` · `engagement` · `nudge` · `initiative_to_event` · `system` (CHECK en base, miroir dans `lib/constants/notification-kinds.ts`). |
| `tag` | Identifiant stable partagé avec le push (`announcement:<id>`, `nudge:event:<id>`…). Sert au marquage « lu » depuis le service worker. |
| `context_type` / `context_id` | Contenu lié (enum `context_type`). `null` pour `system`. La route cible est **reconstruite** depuis ces colonnes via `CONTENT_ROUTE_BUILDER`, jamais lue depuis un `payload.url` figé. |

- **Messages** : plus aucune ligne écrite (push seul via `sendPushToUser`). Les lignes héritées ont été supprimées au backfill ; la messagerie a sa propre boîte de réception.
- **Cascade** : trigger SQL `delete_notifications_for_content()` sur `announcements`, `initiatives`, `events` (AFTER DELETE) — aucune logique applicative.
- **Index** : `(user_id, commune_id, created_at DESC, id DESC)` pour la liste keyset ; partiel `WHERE read_at IS NULL` pour le badge ; `(user_id, tag)` partiel pour le marquage par tag ; `(context_type, context_id)` pour la cascade.

### RPC (SECURITY DEFINER, `auth.uid()`)

- `count_unread_notifications(p_commune_id)` → badge.
- `list_my_notifications(p_commune_id, p_limit, p_before_created_at, p_before_id)` → lignes + `context_status` (`available` · `finished` · `archived` · `suspended` · `deleted`) + `is_author`, calculés par jointure sur le contenu.

---

## Producteurs

`notifyUser(userId, { communeId, kind, context }, payload)` est la seule porte d'entrée unitaire ; `notification-fanout.ts` insère en bulk avec les mêmes colonnes.

| Source | `kind` | `commune_id` | Contexte |
|--------|--------|--------------|----------|
| Fan-out nouveau contenu | `new_content` | commune du contenu | contenu publié |
| Soutien / participation / bénévolat | `engagement` | commune de l'adhésion auteur | contenu concerné |
| Relances cron (annonce expirée/stale, initiative stale, événement passé) | `nudge` | `commune_id` du contenu | contenu relancé |
| Initiative → événement | `initiative_to_event` | commune de l'initiative | événement créé |
| Rappels d'engagement et d'activation push | `system` | `active_commune_id` du profil (sans commune active → push seul, pas de ligne) | `null` |

---

## Lecture (UI)

- **Header résident** (`components/features/resident-header.tsx`) : `NotificationBell` entre le `CommuneSwitcher` et le menu utilisateur sur desktop ; à gauche du menu mobile sur `< md`. Badge serveur `UnreadNotificationsBadgeAsync` (React `cache` + `Suspense`).
- **Mobile** : la cloche est un lien vers `/notifications`.
- **Desktop** : Popover (~380 px) chargé à l'ouverture via `fetchNotificationsPage(undefined, 10)`, « Tout marquer comme lu », lien « Voir toutes les notifications ». `router.refresh()` à la fermeture, après mutation et au retour d'onglet (`visibilitychange`).
- **Page `/notifications`** : groupes « Aujourd'hui / Cette semaine / Plus ancien » (calcul Paris via `@/lib/datetime`, `now` injecté depuis le serveur), `LoadMoreLink` keyset (page de 20), état vide `Card` + `ILLUSTRATIONS.resident.notifications.emptyState`.
- **Ligne** (`NotificationItem`) : icône/couleur depuis `CONTENT_TYPE_TAGS` (source unique partagée avec la messagerie), non lue = `text-text` + point coral, lue = `text-muted`, `RelativeTime`. Marquage lu optimiste au clic.

### Navigation et contenus indisponibles

`isNotificationNavigable` / `buildNotificationHref` (`lib/constants/notification-kinds.ts`) :

- `available` → tout le monde navigue.
- `finished` / `archived` / `suspended` → **seul l'auteur** navigue ; les autres voient une ligne statique avec le badge `CONTENT_STATUS_LABELS` (« Contenu terminé », « Contenu supprimé », « Contenu suspendu »), comme dans la messagerie.
- `deleted` → personne (normalement absent grâce au trigger ; filet de sécurité).
- `system` → toujours navigable ; cible = `payload.url` **relative uniquement**.

---

## Mutations

- `markNotificationRead(id)` : `UPDATE … WHERE id AND user_id = ctx.userId AND read_at IS NULL` (idempotent).
- `markAllNotificationsRead()` : même chose sur la commune active ; `revalidatePath('/notifications')`.
- `POST /api/notifications/read` `{ tag }` (Zod) : appelé par `public/sw.js` au clic sur un push natif, authentifié par cookie de session. Le feed converge avec ce que l'utilisateur a déjà vu.

---

## Rétention

Phase `purgeOldNotifications` du cron lifecycle existant (`docs/cron-config.md`) : lues > 60 j, non lues > 180 j (`lib/constants/retention.ts`), bornée à 500 lignes par catégorie et par exécution.

---

## Tests

- Unitaires : `lib/constants/notification-kinds.test.ts` (navigabilité par statut/auteur, routes, anti open-redirect), `lib/utils/notification-grouping.test.ts` (jours Paris), `lib/services/notification-fanout.test.ts`, `lib/cron/lifecycle-collector.test.ts`.
- Intégration : `tests/integration/notification-center.itest.ts` (statuts RPC, `is_author`, scope commune, keyset, trigger de cascade, marquage par tag sous RLS).

---

## Hors périmètre (à évaluer plus tard)

- Realtime (Supabase Realtime) pour le badge sans refresh.
- Groupement par type (« 3 nouvelles annonces »).
- Centre de notifications côté mairie/backoffice.
- Distinction « archivé » dans la messagerie (`ConversationContextStatus` ne connaît que `available` / `suspended` / `deleted`).
