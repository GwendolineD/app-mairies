# Plan — Centre de notifications in-app

> Décision prise le 10 août 2026 : **Option A retenue** — construire le centre de notifications.
> Statut : **à planifier** (pas de date cible).

---

## Contexte

La table `notifications` est alimentée par le fan-out (sujet 4, fait) et par `notifyUser` (messages directs). Chaque ligne contient `title`, `body`, `payload` (avec URL cible, context_type, context_id), `read_at`, et est indexée sur `(user_id, created_at DESC)`. Les policies RLS autorisent déjà le select/update/delete par l'utilisateur propriétaire.

Aujourd'hui : **aucun code ne lit cette table**. Les lignes s'accumulent sans consommateur.

---

## Pourquoi le faire

1. L'infra d'écriture est déjà en place (bulk insert structuré depuis le fan-out).
2. Le push n'est pas un canal fiable (bloqué par Safari, Firefox, politiques entreprise).
3. Cohérent avec la mission produit : ne rien rater de sa commune sans dépendre d'un opt-in technique du navigateur.

---

## Périmètre

### Lecture (UI)

- **Cloche dans le header résident** avec badge compteur (non-lues).
- **Panneau ou page** listant les notifications récentes, triées par date.
- Chaque item affiche titre + body + date relative, et redirige vers `payload.url` au clic.
- Action "marquer comme lue" (unitaire au clic + bulk "tout marquer comme lu").
- Pagination par curseur (created_at DESC), page de 20.

### Écriture (déjà fait)

- `notification-fanout.ts` : bulk insert pour les nouvelles annonces/initiatives/événements.
- `push-notifications.ts:notifyUser` : insert unitaire pour les messages directs et notifications ad-hoc.

### Rétention (à implémenter)

- Purge des notifications lues depuis plus de **60 jours**.
- Purge des notifications non-lues depuis plus de **180 jours**.
- Exécution dans le cron lifecycle existant (nouvelle phase `purgeOldNotifications`).

### Index

- L'index `idx_notifications_user_created_at` existe déjà.
- Ajouter un index partiel `WHERE read_at IS NULL` pour le compteur de badge (COUNT des non-lues).

---

## Implémentation technique

### 1. Badge compteur (header)

- Composant serveur async `NotificationBadgeAsync` (même pattern que les badges messages non-lus du sujet 6).
- Query : `SELECT count(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`.
- Wrappé dans `<Suspense fallback={null}>` côté layout résident.
- Invalider via `revalidatePath` après les mutations qui insèrent des notifications.

### 2. Liste des notifications

- Route : `/notifications` (ou panneau Popover dans le header — à trancher UX).
- Query paginée : `.from("notifications").select("*").eq("user_id", userId).is("read_at", null).order("created_at", { ascending: false }).range(offset, offset + limit - 1)` (puis onglet "toutes" sans filtre `read_at`).
- Utiliser le client serveur (Server Component).

### 3. Mark as read

- Server action `markNotificationRead(id)` : `.update({ read_at: now() }).eq("id", id).eq("user_id", userId)`.
- Server action `markAllNotificationsRead()` : `.update({ read_at: now() }).eq("user_id", userId).is("read_at", null)`.
- Revalidate le layout pour rafraîchir le badge.

### 4. Purge cron

```sql
DELETE FROM public.notifications
WHERE (read_at IS NOT NULL AND read_at < now() - interval '60 days')
   OR (read_at IS NULL AND created_at < now() - interval '180 days');
```

Ajouté comme phase dans `lib/cron/lifecycle-collector.ts`.

### 5. Migration

- Index partiel : `CREATE INDEX idx_notifications_unread ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;`

---

## Hors périmètre (à évaluer plus tard)

- Realtime (Supabase Realtime pour mettre à jour le badge sans refresh) — pas nécessaire au lancement.
- Groupement par type ("3 nouvelles annonces") — complexité UX à évaluer.
- Notification center côté mairie/backoffice — se concentrer sur l'espace résident d'abord.
- Préférences granulaires in-app (déjà gérées par `user_notification_preferences` pour le push, réutilisable).

---

## Risques et garde-fous

| Risque | Mitigation |
|--------|-----------|
| Table qui grossit sans limite | Purge cron avec TTL 60/180 jours |
| COUNT lent sur grosse table | Index partiel `WHERE read_at IS NULL` |
| Badge qui bloque le rendu | Suspense async (pattern sujet 6) |
| Notification spam (10 publications/jour) | Groupement futur ; pour l'instant acceptable car le push est déjà envoyé au même rythme |

---

## Dépendances

- Aucune dépendance bloquante. Le fan-out (sujet 4) est fait, les données sont déjà écrites.
- Le sujet 7 (agrégats JS) est indépendant.
- La purge peut être livrée avant ou après l'UI (elle protège dans tous les cas).

---

## Ordre de livraison suggéré

1. Migration (index partiel) — 10 min
2. Purge cron — 30 min
3. Badge compteur dans le header — 1h
4. Page/panneau de notifications — 2-3h
5. Mark as read — 30 min
