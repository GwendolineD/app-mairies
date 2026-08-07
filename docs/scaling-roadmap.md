# Roadmap scaling — Tous voisins

Audit réalisé alors que la production comptait **2 communes, 43 utilisateurs, 23 annonces, 4 initiatives, 2 événements**, en anticipation de l'arrivée simultanée de plusieurs communes.

Ce document est une file de travail : **un sujet = un lot de travail autonome**, à prendre dans l'ordre indiqué. Chaque section se lit seule et contient le problème, la correction retenue, ce qu'il faut éviter, le critère d'acceptation et les garde-fous disponibles.

> **Avant de commencer un sujet**, relever les mesures du bloc correspondant dans [`supabase/snippets/scaling-baseline.sql`](../supabase/snippets/scaling-baseline.sql). Après la correction, relancer le même bloc et comparer. Mesurer plutôt que deviner.

---

## Le risque en une phrase

Le socle est sain — feeds paginés par curseurs, `commune_id` systématiquement contraint, RPC pour la messagerie, compteurs dénormalisés. Mais **quatre plafonds invisibles** sont câblés dans le code, et aucun ne provoque d'erreur : ils produisent des **résultats silencieusement faux**, bien plus difficiles à diagnostiquer qu'un crash.

| Seuil atteint | Ce qui casse, sans message d'erreur |
| --- | --- |
| 51ᵉ utilisateur (imminent) | Relances lifecycle jamais envoyées, staff jamais alerté d'un signalement, opt-out e-mail ignoré |
| 1001ᵉ contenu plateforme | E-mails « Publiez votre première annonce » envoyés à des auteurs prolifiques |
| 1001ᵉ membre dans une commune | Les membres au-delà du plafond ne reçoivent aucune notification de nouvelle annonce |
| ~500 membres actifs + pic de publication | Saturation du pool PostgREST → lenteurs et 5xx **pour toute l'app**, pas seulement l'auteur |

**Les sujets 1 à 4 sont le strict nécessaire avant de démarcher.** Les sujets 5 à 8 devraient suivre dans le mois. Les sujets 9 et 10 sont de la dette à amortir tranquillement.

---

## Récapitulatif

| Sujet | Titre | Gravité | Problèmes couverts |
| --- | --- | --- | --- |
| — | [Garde-fous](#sujet-0--garde-fous-fait) | Prérequis | **fait** |
| [1](#sujet-1--index-sur-les-clés-étrangères) | Index sur les clés étrangères | P1 | 5 |
| [2](#sujet-2--listusers-sans-pagination) | `listUsers()` sans pagination | P0 | 1 |
| [3](#sujet-3--troncature-silencieuse-à-1000-lignes) | Troncature silencieuse à 1000 lignes | P0 | 2, 4 |
| [4](#sujet-4--fan-out-notifications-non-borné) | Fan-out notifications non borné | P0 | 3 |
| [5](#sujet-5--email_queue-sans-réservation) | `email_queue` sans réservation | P1 | 6 |
| [6](#sujet-6--latence-de-navigation) | Latence de navigation | P1 | 7 |
| [7](#sujet-7--agrégats-calculés-en-js) | Agrégats calculés en JS | P1 | 8, 9 |
| [8](#sujet-8--rétention-des-tables-append-only) | Rétention des tables append-only | P2 | 10 |
| [9](#sujet-9--rls--authuid-non-encapsulé) | RLS : `auth.uid()` non encapsulé | P2 | 11 |
| [10](#sujet-10--le-reste) | Le reste | P2/P3 | 12, 13, 14 |

---

## Sujet 0 — Garde-fous (fait)

Posés avant toute correction, parce que les sujets 1 à 10 modifient des invariants qu'il faut pouvoir vérifier automatiquement.

### Ce qui existe maintenant

| Fichier | Ce qu'il verrouille | Sert au sujet |
| --- | --- | --- |
| `lib/services/notification-fanout.test.ts` | Liste exacte des destinataires : auteur exclu côté base, opt-out respecté, absence de préférences = inclus, `excludeUserIds` honoré, sortie immédiate si commune vide | 4 |
| `lib/cron/email-sender.test.ts` | Machine à états de `email_queue` : `cancelled`, `sent`, `pending` + tentative incrémentée, `failed` au seuil. Plus un **test de caractérisation** du bug de `shouldSend` | 2, 5 |
| `tests/integration/tenant-isolation.itest.ts` | Isolation entre communes évaluée par les vraies policies RLS, sur 7 tables, en lecture **et** en écriture | 9 |
| `tests/integration/fixtures.ts` | Deux communes jetables (INSEE 99001 / 99002) créées et détruites par la suite elle-même | 9 |
| `supabase/snippets/scaling-baseline.sql` | 9 blocs de mesure en lecture seule : plafond de lignes, FK sans index, volumétrie, rétention, requêtes coûteuses, taille du fan-out | tous |

### Comment les lancer

```bash
npm test                  # unitaires, aucune dépendance externe
npm run test:integration  # nécessite `npx supabase start` + .env.local
```

Les tests d'intégration utilisent l'extension `.itest.ts`, qui ne correspond pas au motif de `vitest.config.ts` : la suite unitaire reste donc rapide et sans Docker.

### Deux points d'attention sur ces garde-fous

**Le test de caractérisation de `shouldSend` verrouille le bug, pas le comportement souhaité.** Il affirme qu'aujourd'hui l'e-mail part malgré l'opt-out quand le destinataire n'est pas sur la première page de `listUsers()`. C'est volontaire : quand le sujet 2 sera corrigé, **ce test doit échouer**. Il faudra alors l'inverser, pas le supprimer.

**Les fixtures d'intégration purgent avant de créer.** Un run interrompu ne bloque donc pas le suivant. Elles n'utilisent jamais `supabase db reset` et ne touchent pas au seed de développement (Les Authieux, 27027).

### Reste à activer côté Dashboard (hébergé)

- **Advisors** Supabase : lints RLS et index manquants (Dashboard > Advisors).
- **`pg_stat_statements`** : `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` — nécessaire aux blocs 7 et 8 du snippet.
- **Relever la valeur de « Max rows »** (Dashboard > Settings > API). Elle conditionne l'ampleur du sujet 3. Si elle vaut 1000 comme en local, la troncature est déjà active.

---

## Sujet 1 — Index sur les clés étrangères

**Gravité : P1 — mais à faire en premier.** Problème 5 de l'audit.

### Le problème

Postgres n'indexe pas automatiquement les clés étrangères. Le bloc 2 du snippet en dénombre **36 sans index** dans le schéma `public`. Deux conséquences :

- Une suppression de compte ou un départ de commune déclenche des `CASCADE` / `SET NULL` en *seq scan* sur des tables qui grossissent vite, avec des verrous à la clé.
- La policy `conversations_select` filtre sur `participant_a` et `participant_b`, précisément deux colonnes non indexées.

Les FK les plus coûteuses à laisser sans index, parce qu'elles portent sur des tables à forte croissance :

| Table | Colonne |
| --- | --- |
| `messages` | `sender_id` |
| `conversations` | `participant_a`, `participant_b`, `created_by_user_id`, `last_message_sender_id` |
| `initiative_responses` | `membership_id` |
| `event_participants` | `membership_id` |
| `event_volunteers` | `membership_id` |
| `content_outcomes` | `membership_id` |
| `reports` | `reporter_membership_id` |
| `profiles` | `active_commune_id` |
| `analytics_events` | `user_id` |
| `events` | `source_initiative_id` |
| `neighbor_invites` | `inviter_membership_id` |
| `support_requests` | `membership_id` |

### La correction

Une migration **purement additive** : `CREATE INDEX IF NOT EXISTS` sur les colonnes ci-dessus. Aucun impact fonctionnel, réversible par un `DROP INDEX`.

C'est la correction la plus rentable du lot, et **la seule dont le coût augmente si on attend** : tant que les tables sont petites, la création est instantanée. Dans six mois il faudra du `CREATE INDEX CONCURRENTLY` et une fenêtre de maintenance.

### À ne pas faire

Ne pas indexer les FK vers les tables de nomenclature (`announcement_categories`, `initiative_event_categories`, `content_categories`) : ces tables comptent une dizaine de lignes, l'index ne servirait jamais et alourdirait chaque écriture.

### Critère d'acceptation

Le bloc 2 du snippet ne renvoie plus les lignes du tableau ci-dessus. Le bloc 3 montre les nouveaux index.

---

## Sujet 2 — `listUsers()` sans pagination

**Gravité : P0 — le plus imminent (7 utilisateurs de marge).** Problème 1 de l'audit.

### Le problème

`auth.admin.listUsers()` est appelé sans paramètre de pagination dans **10 emplacements**. Le client envoie un `per_page` vide, et le serveur Auth applique son défaut de **50**. La production est à 43 utilisateurs.

Au-delà du 50ᵉ, chaque emplacement échoue silencieusement, de trois façons différentes :

| Fichier | Conséquence |
| --- | --- |
| `lib/cron/lifecycle-collector.ts` (6 occurrences) | `if (!email) continue` → la relance est simplement sautée |
| `lib/actions/reports.ts:159,187` | Les mails staff / admin ne partent plus → **angle mort de modération** |
| `lib/cron/email-sender.ts:36` | Utilisateur non trouvé → `shouldSend` renvoie `true` → l'e-mail part **malgré son opt-out** |

### La correction

Un helper unique `getEmailsByUserIds(ids)` qui résout les e-mails de façon ciblée, et le substituer aux 10 appels.

L'intérêt du helper n'est pas seulement de corriger : il crée une **couture**. On pourra ensuite changer son implémentation (par exemple une table miroir `user_emails` alimentée par trigger) sans retoucher un seul appelant.

### À ne pas faire

Ne pas se contenter de passer `perPage: 1000`. Ça déplace le plafond sans le supprimer, et rapatrie tout l'annuaire pour en extraire quelques adresses.

### Critère d'acceptation

- Aucun appel à `listUsers()` hors du helper (et hors des scripts d'administration).
- Le test de caractérisation de `lib/cron/email-sender.test.ts` **échoue** — c'est le signal que le bug est corrigé. L'inverser alors : recipient introuvable devrait désormais annuler l'envoi, pas le déclencher.

---

## Sujet 3 — Troncature silencieuse à 1000 lignes

**Gravité : P0.** Problèmes 2 et 4 de l'audit.

### Le problème

`supabase/config.toml:18` fixe `max_rows = 1000`, et le défaut Supabase hébergé est également 1000. Toute requête sans `.limit()` ni `.range()` est donc **coupée à 1000 lignes sans erreur**.

Cette valeur n'est pas lisible en SQL — PostgREST la reçoit par son environnement. Le bloc 1 du snippet explique où la lire et comment observer la troncature via l'en-tête `Content-Range`.

Trois chemins où la troncature produit un bug réel :

**a. Destinataires du fan-out** — `lib/services/notification-fanout.ts:59` sélectionne les memberships actifs sans limite. Au-delà de 1000 membres actifs dans une commune, les suivants ne sont **jamais notifiés**.

**b. Suppression de compte** — `deleteAuthoredContent` et `performAccountDeletion` : suppression incomplète, donc **exposition RGPD**. Même remarque pour `archiveCommuneConversations`.

**c. Détection d'auteur faussée** (problème 4) — `lib/cron/lifecycle-collector.ts:188-199` charge 1000 `author_membership_id` **de toute la plateforme** au lieu de filtrer sur les 200 utilisateurs du lot. Dès que la plateforme dépasse 1000 contenus, des auteurs actifs sont classés « sans contenu » et reçoivent une relance absurde. Très visible pour l'utilisateur.

### La correction

- Pour **a** et **b** : une boucle explicite en `.range()` par pages de 1000, ou un RPC qui fait le travail en SQL côté base.
- Pour **c** : inverser le sens de la requête — récupérer les memberships des 200 profils du lot, puis interroger `.in('author_membership_id', mIds)`. Le volume devient borné par le lot.

### À ne pas faire

**Ne pas relever `max_rows`.** Ça paraît régler le problème d'un coup, mais ça ne fait que déplacer la troncature silencieuse vers l'épuisement mémoire et les timeouts, tout en supprimant un garde-fou utile contre les requêtes accidentelles. Le plafond n'est pas le bug : le code appelant qui suppose l'exhaustivité l'est.

### Critère d'acceptation

Aucune requête sur ces chemins ne renvoie exactement `max_rows` lignes. Le bloc 8 du snippet ne fait plus apparaître de requête dont `lignes_par_appel` frôle le plafond.

---

## Sujet 4 — Fan-out notifications non borné

**Gravité : P0 — le scénario de panne le plus crédible de l'audit.** Problème 3 de l'audit.

### Le problème

`lib/services/notification-fanout.ts:100` lance un `notifyUser` par destinataire via `Promise.all`. Chaque `notifyUser` crée **son propre client service-role**, fait un `INSERT` dans `notifications`, puis un `SELECT` sur `push_subscriptions`.

Pour une commune de 2000 membres, **une seule publication d'annonce déclenche ~4000 requêtes PostgREST simultanées**. PostgREST met en file d'attente au-delà de la taille de son pool : les requêtes des **autres utilisateurs** attendent ou échouent. La panne ne touche donc pas l'auteur de la publication, mais toute l'application.

### La correction

Quatre changements, dans deux fichiers :

1. Un seul client service-role réutilisé pour tout le fan-out.
2. Un `insert()` en masse par lots de 500 au lieu de N inserts.
3. Un chargement groupé des abonnements push via `.in('user_id', ids)`.
4. Un envoi push à concurrence bornée (~20 en parallèle).

Sémantique identique, coût divisé par ~1000.

### À ne pas faire

**Ne pas introduire une file d'attente et un worker.** C'est l'architecture correcte à terme, mais aujourd'hui c'est une nouvelle table, un nouveau cron, une nouvelle surface d'observabilité et de nouveaux modes de panne — pour un risque de régression élevé. L'insert en masse plus la concurrence bornée réduisent le coût de trois ordres de grandeur avec un diff confiné et une sémantique inchangée. La file devient pertinente si une commune dépasse ~5000 membres.

### Ordre

À traiter **après le sujet 3** : les deux touchent le même fichier, autant les enchaîner, et corriger la justesse avant la performance.

### Critère d'acceptation

`lib/services/notification-fanout.test.ts` passe **sans modification**. C'est tout l'intérêt de ce garde-fou : la liste des destinataires est un invariant, seule la mécanique de livraison change.

Le bloc 9 du snippet donne la taille réelle du fan-out par commune, à comparer au plafond du sujet 3.

---

## Sujet 5 — `email_queue` sans réservation

**Gravité : P1.** Problème 6 de l'audit.

### Le problème

`lib/cron/email-sender.ts:54` lit les lignes `pending` et les traite **sans les marquer**. Le cron tourne toutes les 2 minutes ; un run qui dépasse ce délai — probable quand le backlog monte — chevauche le suivant, et **les deux envoient les mêmes e-mails**. Réputation SMTP et plaintes à la clé.

### La correction

Un RPC `claim_email_batch(p_limit)` :

```sql
UPDATE public.email_queue
SET status = 'processing', claimed_at = now()
WHERE id IN (
  SELECT id FROM public.email_queue
  WHERE status = 'pending' AND scheduled_at <= now()
  ORDER BY scheduled_at
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

**Prévoir la reprise des `processing` bloqués depuis plus de 10 minutes**, sinon un crash en plein vol gèle des lignes définitivement.

### Ordre

Dépend du sujet 2 : retirer `listUsers()` de `shouldSend` raccourcit déjà fortement chaque run, donc réduit la probabilité de chevauchement. **Mesurer la durée d'un run après le sujet 2 avant de dimensionner le batch.**

### Critère d'acceptation

`lib/cron/email-sender.test.ts` continue de décrire les mêmes transitions, complété par le nouvel état `processing`.

`FOR UPDATE SKIP LOCKED` ne peut pas être testé via PostgREST : chaque requête `supabase-js` est une transaction distincte. Vérifier soit par un test unitaire de la logique de réservation, soit manuellement avec deux sessions psql concurrentes.

### Note annexe

`getDelayMs()` évalue `parseInt(val) || DEFAULT_DELAY_MS` : une valeur `CRON_EMAIL_DELAY_MS=0` est donc silencieusement ramenée à 500 ms. Sans gravité, mais à corriger en passant, puisque ce fichier est déjà ouvert. `lib/cron/email-sender.test.ts` contourne le comportement avec la valeur `1`.

---

## Sujet 6 — Latence de navigation

**Gravité : P1.** Problème 7 de l'audit.

### Le problème

`proxy.ts` fait un `getUser()` — un aller-retour réseau vers l'API Auth — sur quasi toutes les requêtes, puis `loadSessionResult()` en refait un, plus 2 requêtes DB. `cache()` déduplique dans un même rendu, mais pas entre navigations.

S'y ajoutent les badges non cachés : messages non lus côté résident, signalements en attente côté mairie, et **3 COUNT globaux** côté backoffice. À 500 utilisateurs actifs simultanés, cet overhead seul représente plusieurs centaines de requêtes par seconde.

### La correction

- Envelopper chaque badge dans un `<Suspense>` pour qu'il ne bloque plus l'affichage du shell.
- Fusionner les 3 COUNT du backoffice en un seul RPC.

### Critère d'acceptation

Le bloc 7 du snippet montre une baisse du temps cumulé sur les requêtes de badges.

---

## Sujet 7 — Agrégats calculés en JS

**Gravité : P1.** Problèmes 8 et 9 de l'audit.

### Le problème

**a. Compteurs de participation** — `listVolunteerCountsByEventId` et `listParticipantCountsByEventId` (`lib/queries/events.ts:103-137`) rapatrient toutes les lignes de participation pour en faire un `.length`. Même schéma pour les soutiens d'initiative et `fetchReportCountByContext`. Double peine : coût réseau inutile, et **compteur faux** dès que le total dépasse 1000 lignes (sujet 3).

**b. Stats backoffice** — `getContentPopulationStats` et `getPopulationStats` chargent `announcements`, `initiatives`, `events` et `memberships` **sans filtre de commune ni limite** pour agréger en JS. `listPilotCommunesPage` charge toutes les communes puis pagine avec `.slice()`. Les TODO sont déjà dans le code.

### La correction

Des RPC d'agrégation : `COUNT(*) ... GROUP BY event_id` pour **a**, `GROUP BY commune_id` pour **b**, et une pagination SQL réelle pour la liste des communes.

Ce sont des RPC **nouveaux**, donc aucun risque sur l'existant tant que le remplacement est fait requête par requête.

### Critère d'acceptation

Une ligne de résultat par événement au lieu d'une par participant. Le bloc 8 du snippet ne fait plus apparaître ces requêtes.

---

## Sujet 8 — Rétention des tables append-only

**Gravité : P2.** Problème 10 de l'audit.

### Le problème

**`notifications` est une table en écriture seule** : aucun endroit du code ne la lit, il n'y a pas de centre de notifications dans l'UI. Avec le fan-out, 20 communes × 1000 membres × 10 contenus/jour produisent **200 000 lignes par jour que personne ne consulte**.

Même constat, sans purge, pour `analytics_events`, `audit_logs`, et les lignes `sent` de `email_queue`.

### La correction

**Trancher d'abord la question de l'UI**, parce qu'elle détermine la correction :

- Si le centre de notifications doit exister → mettre en place une rétention (lues > 90 j, non lues > 180 j) et un index partiel sur les non-lues.
- S'il ne doit pas exister → **arrêter d'écrire**.

Dans les deux cas, ajouter une phase de purge au cron lifecycle existant plutôt que de créer un nouveau cron.

### Ordre

À enchaîner après le sujet 4 : c'est le fan-out qui alimente la croissance de `notifications`.

### Critère d'acceptation

Les blocs 5 et 6 du snippet donnent la volumétrie et le volume purgeable avant / après.

---

## Sujet 9 — RLS : `auth.uid()` non encapsulé

**Gravité : P2 — mais le changement le plus dangereux de la liste.** Problème 11 de l'audit.

### Le problème

**103 occurrences de `auth.uid()`, aucune encapsulée.** Sans `(select auth.uid())`, Postgres ne peut pas hisser l'appel en InitPlan et le **réévalue à chaque ligne**, en cascade à travers `can_access_commune_content` → `has_active_membership`. C'est l'anti-pattern de performance Supabase le plus documenté.

Les feeds paginés restent protégés par leurs index, mais les `count: 'exact'` évaluent la policy sur toutes les lignes correspondantes.

### La correction

Réécriture **incrémentale, une table par migration**, en commençant par `announcements`, `initiatives`, `events`, `memberships`, `profiles`. Chaque migration validée par `tests/integration/tenant-isolation.itest.ts`.

### À ne pas faire

**Jamais de passe globale.** C'était initialement classé P0, puis rétrogradé après réévaluation : le gain devient décisif vers 100 000 lignes, pas 10 000, alors que le risque est le plus élevé de tout l'audit. Une erreur dans une policy, c'est une fuite de données entre communes ou un blocage d'accès en production. Un remplacement automatisé sur 103 occurrences est exactement le type de changement qui passe le build et casse l'isolation locative en silence.

### Critère d'acceptation

`npm run test:integration` passe après **chaque** migration, pas seulement à la fin. Le test couvre les 7 tables tenant-scoped en lecture et en écriture, et chaque cas associe une assertion négative (rien de la commune B) à un contrôle positif (la commune A reste visible) — de sorte qu'une policy trop restrictive échoue aussi.

Si une table n'est pas couverte par le test d'isolation, **ajouter le cas avant de toucher sa policy**.

---

## Sujet 10 — Le reste

**Gravité : P2 / P3.** Problèmes 12, 13 et 14 de l'audit.

### a. `count: 'exact'` sur les requêtes paginées (P2)

`listAnnouncementsPage:125` demande le COUNT complet en plus de la page, alors que `countAnnouncements` fait déjà des COUNT dédiés en `head: true`. À 500 annonces c'est indolore ; à 50 000, le COUNT devient le facteur limitant du feed.

*Correction :* rendre le COUNT optionnel via un paramètre, et le désactiver sur les appels « charger plus » où le curseur suffit.

### b. Limitation de débit en mémoire (P2)

`lib/utils/rate-limit.ts` stocke les compteurs dans une `Map` en mémoire : remise à zéro à chaque redémarrage, et inefficace dès qu'il y a plusieurs instances. Surtout, **`/api/uploads/cloudinary` n'a aucune limite** — un seul utilisateur peut faire grimper la facture Cloudinary.

*Correction :* limiteur persistant en base, en commençant par la route d'upload.

### c. `select('*')` sur listes et cartes (P3)

Les feeds et les vues carte (`limit(500)`) rapatrient la colonne `description` (HTML) alors que les cartes n'affichent qu'un extrait.

*Correction :* colonnes explicites. Gain purement réseau, mais multiplié par 500 items sur la vue carte.

### d. Éventuellement : `getClaims()` dans le proxy

Valider le JWT localement au lieu d'un aller-retour Auth. Gain fort sur la latence, mais nécessite une rotation vers des clés asymétriques et un traitement soigné du rafraîchissement de token. **À tester en staging, pas en direct.**
