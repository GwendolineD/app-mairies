# Roadmap scaling — Tous voisins

Audit réalisé alors que la production comptait **2 communes, 43 utilisateurs, 23 annonces, 4 initiatives, 2 événements**, en anticipation de l'arrivée simultanée de plusieurs communes.

Ce document est une file de travail : **un sujet = un lot de travail autonome**. Chaque section se lit seule et contient le problème, la correction retenue, ce qu'il faut éviter, le critère d'acceptation et les garde-fous disponibles. L'ordre de travail est celui du [récapitulatif](#récapitulatif), qui ne suit plus la numérotation : les numéros sont des identifiants stables, cités dans le code et les tests.

> **Avant de commencer un sujet**, relever les mesures du bloc correspondant dans [`supabase/snippets/scaling-baseline.sql`](../supabase/snippets/scaling-baseline.sql). Après la correction, relancer le même bloc et comparer. Mesurer plutôt que deviner.

---

## Le risque en une phrase

Le socle est sain — feeds paginés par curseurs, `commune_id` systématiquement contraint, RPC pour la messagerie, compteurs dénormalisés. Mais **cinq plafonds invisibles** sont câblés dans le code, et aucun ne provoque d'erreur : ils produisent des **résultats silencieusement faux**, bien plus difficiles à diagnostiquer qu'un crash.

| Seuil atteint | Ce qui casse, sans message d'erreur | Sujet |
| --- | --- | --- |
| 51ᵉ utilisateur | Relances lifecycle jamais envoyées, staff jamais alerté d'un signalement, opt-out e-mail ignoré | 2 — **fait** |
| 1001ᵉ contenu plateforme | E-mails « Publiez votre première annonce » envoyés à des auteurs prolifiques | 3 — **fait** |
| ~217ᵉ membre actif dans une commune | Le filtre `.in()` sur les préférences dépasse 8 Ko d'URL → 414 ignoré → **tout le monde notifié, y compris les opt-out** | 4 — **fait** |
| 1001ᵉ membership plateforme | Utilisateurs absents des listes filtrées du backoffice, et du total affiché à côté | 7 |
| 1001ᵉ membre actif dans une commune | Les membres au-delà du plafond ne reçoivent aucune notification de nouvelle annonce | 4 — **fait** |
| ~500 membres actifs + pic de publication | Saturation du pool PostgREST → lenteurs et 5xx **pour toute l'app**, pas seulement l'auteur | 4 — **fait** |

**Le sujet 7 est le strict nécessaire avant de démarcher.** Les sujets 3 et 4 sont faits. Le sujet 6 devrait suivre dans le mois. Le sujet 5 a été rétrogradé en P2 après réévaluation (le risque de chevauchement est devenu négligeable après le sujet 2). Les sujets 5, 8, 9 et 10 sont de la dette à amortir tranquillement.

---

## Ce que `max_rows` tronque — et ce qu'il ne tronque pas

`supabase/config.toml:18` fixe `max_rows = 1000`, et le défaut Supabase hébergé est également 1000. Cette valeur n'est pas lisible en SQL : PostgREST la reçoit par son environnement. Le bloc 1 du snippet explique où la lire et comment observer la troncature via l'en-tête `Content-Range`.

Le périmètre exact du plafond conditionne les sujets 3, 4 et 7. Il est plus étroit qu'il n'y paraît :

| Type de requête | Plafonné ? |
| --- | --- |
| `select()` sur une table ou une vue | **Oui**, silencieusement |
| RPC `returns table` / `returns setof` | **Oui** — PostgREST traite une fonction table-valued comme une lecture |
| RPC renvoyant un scalaire ou un agrégat | Non |
| Lignes affectées par un `delete()` / `update()` | **Non** — c'est précisément pourquoi la préférence `Prefer: max-affected` existe côté protocole |
| `.in()` avec ~217+ UUID (8 Ko d'URL) | **Oui** — le proxy renvoie 414 URI Too Long, que `supabase-js` traduit en `{ data: null }` sans erreur |

Deux conséquences pratiques :

- **Un RPC n'est pas un remède en soi.** Remplacer une lecture non bornée par un RPC `returns table` reproduit le plafond à l'identique. C'est le cas de `admin_user_emails` (sujet 2) : il est plafonné à `max_rows`, sans conséquence aujourd'hui puisque tous ses appelants passent des lots de 200 au maximum. Le seul RPC qui supprime réellement le plafond est celui qui **fait le travail entier côté base** et ne renvoie qu'un agrégat.
- **Les suppressions ne sont jamais partielles à cause de `max_rows`.** Un `delete()` sans limite supprime tout ce qui correspond au filtre. Un chemin de suppression qui paraît tronqué l'est pour une autre raison, à chercher ailleurs.

**Ne pas relever `max_rows`.** Ça paraît régler le problème d'un coup, mais ça ne fait que déplacer la troncature silencieuse vers l'épuisement mémoire et les timeouts, tout en supprimant un garde-fou utile contre les requêtes accidentelles. Le plafond n'est pas le bug : le code appelant qui suppose l'exhaustivité l'est.

### Écarté après vérification : la suppression de compte

L'audit initial classait `performAccountDeletion` et `archiveCommuneConversations` parmi les chemins tronqués, avec « suppression incomplète, donc exposition RGPD » à la clé. **C'est faux, pour trois raisons indépendantes** — chacune suffirait. La note est conservée ici pour éviter que l'hypothèse soit rouverte.

1. `max_rows` ne borne pas les lignes affectées par un `delete()`. Les `DELETE ... in("author_membership_id", …)` suppriment tout, quel que soit le volume.
2. Les lectures concernées filtrent sur les memberships d'**un seul** utilisateur. Il faudrait qu'une personne ait publié plus de 1000 annonces, initiatives ou événements à elle seule pour les tronquer — et la seule conséquence serait un sous-comptage dans `deleted_content_creation_archive`, une statistique, pas une donnée personnelle conservée. Même raisonnement pour `archiveCommuneConversations`, qui supposerait plus de 1000 conversations pour un utilisateur dans une seule commune.
3. `author_membership_id` est déclaré `ON DELETE RESTRICT` (`20260522000000_initial_schema.sql:172,197,229`). Si la suppression du contenu était malgré tout incomplète, le `DELETE` sur `memberships` qui suit échouerait sur une violation de clé étrangère et la fonction retournerait une erreur. Le mode de panne serait **bruyant**, à l'exact opposé de la prémisse.

Ne pas engager de correction sur ce chemin : c'est une suppression irréversible sur un chemin critique, le risque de régression y est réel et le bénéfice nul.

---

## Récapitulatif

Les numéros sont des **identifiants stables** — ils sont cités dans le code, les migrations et les tests. La table est triée par **ordre d'exécution recommandé**, pas par numéro.

| Sujet | Titre | Gravité | Problèmes couverts |
| --- | --- | --- | --- |
| — | [Garde-fous](#sujet-0--garde-fous-fait) | Prérequis | **fait** |
| — | [Index FK](#sujet-1--index-sur-les-clés-étrangères-fait) | P1 | **fait** |
| — | [`listUsers()` sans pagination](#sujet-2--listusers-sans-pagination-fait) | P0 | **fait** |
| — | [Collecteur lifecycle : détection d'auteur faussée](#sujet-3--collecteur-lifecycle--détection-dauteur-faussée-fait) | P1 | **fait** |
| — | [Fan-out notifications](#sujet-4--fan-out-notifications-fait) | P0 | **fait** |
| [8](#sujet-8--rétention-des-tables-append-only) | Rétention des tables append-only | P2 | 10 |
| [7](#sujet-7--agrégats-et-filtres-calculés-en-js) | Agrégats et filtres calculés en JS | P1 | 2b, 8, 9 |
| [5](#sujet-5--email_queue-sans-réservation) | `email_queue` sans réservation | P2 | 6 |
| [6](#sujet-6--latence-de-navigation) | Latence de navigation | P1 | 7 |
| [9](#sujet-9--rls--authuid-non-encapsulé) | RLS : `auth.uid()` non encapsulé | P2 | 11 |
| [10](#sujet-10--le-reste) | Le reste | P2/P3 | 12, 13, 14 |

Le problème 2 de l'audit — « troncature silencieuse à 1000 lignes » — ne constitue plus un sujet à lui seul. Il s'est révélé être une **famille de causes** plutôt qu'un lot de travail : ses occurrences ont été rattachées aux sujets qui touchent déjà les fichiers concernés (4a pour le fan-out, 7a pour les filtres du backoffice), et son troisième chemin supposé — la suppression de compte — n'existait pas. Voir la section sur `max_rows` ci-dessus.

---

## Sujet 0 — Garde-fous (fait)

Posés avant toute correction, parce que les sujets 1 à 10 modifient des invariants qu'il faut pouvoir vérifier automatiquement.

### Ce qui existe maintenant

| Fichier | Ce qu'il verrouille | Sert au sujet |
| --- | --- | --- |
| `lib/services/notification-fanout.test.ts` | Liste exacte des destinataires : auteur exclu côté base, opt-out respecté, absence de préférences = inclus, `excludeUserIds` honoré, sortie immédiate si commune vide. **Mais aussi la mécanique de livraison — voir le point d'attention ci-dessous** | 4 |
| `lib/cron/email-sender.test.ts` | Machine à états de `email_queue` : `cancelled`, `sent`, `pending` + tentative incrémentée, `failed` au seuil. Plus deux tests vérifiant le fix de `shouldSend` (opt-out honoré, invitations envoyées) | 2, 5 |
| `tests/integration/tenant-isolation.itest.ts` | Isolation entre communes évaluée par les vraies policies RLS, sur 7 tables, en lecture **et** en écriture | 9 |
| `tests/integration/fixtures.ts` | Deux communes jetables (INSEE 99001 / 99002) créées et détruites par la suite elle-même | 9 |
| `supabase/snippets/scaling-baseline.sql` | 9 blocs de mesure en lecture seule : plafond de lignes, FK sans index, volumétrie, rétention, requêtes coûteuses, taille du fan-out | tous |

### Comment les lancer

```bash
npm test                  # unitaires, aucune dépendance externe
npm run test:integration  # nécessite `npx supabase start` + .env.local
```

Les tests d'intégration utilisent l'extension `.itest.ts`, qui ne correspond pas au motif de `vitest.config.ts` : la suite unitaire reste donc rapide et sans Docker.

### Trois points d'attention sur ces garde-fous

**`notification-fanout.test.ts` verrouille la mécanique, pas seulement les destinataires.** Sa documentation affirme le contraire, et le sujet 4 s'appuyait sur cette affirmation pour poser « le test passe sans modification » en critère d'acceptation. C'est faux, pour deux raisons : le stub de requête n'expose que `select`, `eq`, `neq` et `in` — ajouter un `.range()` pour paginer fait échouer le stub, l'erreur est avalée par le `try/catch` du fan-out et cinq cas sur sept tombent ; et les assertions lisent les appels à `notifyUser`, or le sujet 4 consiste précisément à remplacer ce `notifyUser` par destinataire par un insert en masse. Le test devra donc être **réécrit en même temps que le fan-out**, pas simplement relancé. Voir le critère d'acceptation révisé du sujet 4.

**Le test de caractérisation de `shouldSend` a été remplacé par deux cas.** L'ancien test affirmait que l'e-mail partait malgré l'opt-out quand le destinataire n'était pas sur la première page de `listUsers()`. Avec le sujet 2 corrigé, ce comportement n'existe plus. Les deux nouveaux tests vérifient : (1) qu'un `recipient_user_id` renseigné avec opt-out annule l'envoi, et (2) qu'un `recipient_user_id` null (invitation) envoie toujours.

**Les fixtures d'intégration purgent avant de créer.** Un run interrompu ne bloque donc pas le suivant. Elles n'utilisent jamais `supabase db reset` et ne touchent pas au seed de développement (Les Authieux, 27027).

### Reste à activer côté Dashboard (hébergé)

- **Advisors** Supabase : lints RLS et index manquants (Dashboard > Advisors).
- **`pg_stat_statements`** : `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` — nécessaire aux blocs 7 et 8 du snippet.
- **Relever la valeur de « Max rows »** (Dashboard > Settings > API). Elle conditionne l'ampleur des sujets 4a et 7a. Si elle vaut 1000 comme en local, la troncature est déjà active.

---

## Sujet 1 — Index sur les clés étrangères (fait)

**Gravité : P1 — mais à faire en premier.** Problème 5 de l'audit.

Mesuré le 8 août 2026 : bloc 2 renvoyait 36 FK sans index. Après migration `20260808093324_foreign_key_indexes.sql`, il n'en reste que 3 (les FK de nomenclature volontairement exclues). 33 index créés.

### Le problème

Postgres n'indexe pas automatiquement les clés étrangères. Le bloc 2 du snippet en dénombrait **36 sans index** dans le schéma `public`. Principale conséquence :

- Une suppression de compte ou un départ de commune déclenche des `CASCADE` / `SET NULL` en *seq scan* sur des tables qui grossissent vite, avec des verrous à la clé.

> **Note :** la policy `conversations_select` contient un `OR` avec `is_conversation_participant(id)` — une fonction qui dépend de la ligne en cours. Cela rend la policy **non indexable** quels que soient les index sur `participant_a` / `participant_b`. Ces deux index servent uniquement la cascade `ON DELETE SET NULL` depuis `auth.users`, pas les lectures. La restructuration de cette policy est un candidat pour le sujet 9 ou 10.

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

### Note sur `analytics_events`

`analytics_events.user_id` a été indexé malgré une table vide en production. L'explication : la route `app/api/analytics/route.ts` et le helper `lib/analytics/track.ts` existent, mais **`track()` n'est appelé depuis aucun composant**. Le pipeline analytics est un échafaudage jamais branché. L'index ne coûte rien sur une table vide et évite d'y revenir si le pipeline est un jour connecté. Voir le sujet 8 pour la décision à prendre sur cette table.

### Critère d'acceptation

Le bloc 2 du snippet ne renvoie plus que les 3 FK de nomenclature. Le bloc 3 montre les 33 nouveaux index.

---

## Sujet 2 — `listUsers()` sans pagination (fait)

**Gravité : P0 — corrigé le 8 août 2026.** Problème 1 de l'audit.

### Le problème

`auth.admin.listUsers()` était appelé sans paramètre de pagination dans **11 emplacements** (et non 10 comme initialement compté). Le client envoyait un `per_page` vide, et le serveur Auth appliquait son défaut de **50**, triés par `created_at DESC` — ce sont donc les comptes **les plus anciens** (staff, maire, admins plateforme, membres fondateurs) qui disparaissaient en premier.

Au-delà du 50ᵉ, chaque emplacement échouait silencieusement, de trois façons différentes :

| Fichier | Conséquence |
| --- | --- |
| `lib/cron/lifecycle-collector.ts` (6 occurrences) | `if (!email) continue` → la relance était simplement sautée |
| `lib/actions/reports.ts:159,187` | Les mails staff / admin ne partaient plus → **angle mort de modération** |
| `lib/actions/cancellation.ts:137` | Staff non notifié de la résiliation |
| `lib/services/initiative-to-event-notification.ts:95` | Supporters non notifiés de la transformation en événement |
| `lib/cron/email-sender.ts:36` | Utilisateur non trouvé → `shouldSend` renvoyait `true` → l'e-mail partait **malgré son opt-out** |
| `lib/email/send-verification-email.ts:84` | Boucle paginée jusqu'à 2000 comptes — même plafond déplacé, sur un chemin d'inscription |

### La correction

1. **RPC `admin_user_emails(uuid[])`** — résolution `id → email` via un seul aller-retour SQL, sans le plafond de 50 de `listUsers()`.
2. **Helper `getEmailsByUserIds`** (`lib/services/user-emails.ts`) — interface unique, erreur levée, Map typée.
3. **Substitution des 10 appels `id → email`** — lifecycle-collector ×6, reports ×2, cancellation, initiative-to-event.
4. **Garde ESLint `no-restricted-syntax`** — interdit `listUsers()` dans `lib/**`, `app/**`, `components/**`.
5. **Colonne `email_queue.recipient_user_id`** — `ON DELETE CASCADE`, index, backfill des `pending`.
6. **Réécriture de `shouldSend`** — `recipient_user_id` null = invitation, on envoie ; sinon vérification des préférences.
7. **RPC `admin_user_id_by_email(text)`** — résolution `email → id` pour `findAuthUserByEmail`, qui paginait jusqu'à 2000.

### À ne pas faire

Ne pas se contenter de passer `perPage: 1000`. Ça déplace le plafond sans le supprimer, et rapatrie tout l'annuaire pour en extraire quelques adresses.

### Critère d'acceptation (vérifié)

- `rg 'listUsers\('` ne renvoie plus que `tests/integration/fixtures.ts` et `scripts/bootstrap-super-admin.ts`.
- La règle ESLint maintient l'interdiction.
- `npm test` vert avec les deux cas opt-out / invitation.
- `npm run lint` et `npm run build` sans nouvelle erreur.

### Réserve : `admin_user_emails` reste plafonné à `max_rows`

Le RPC est déclaré `returns table`, donc PostgREST le traite comme une lecture et lui applique `max_rows`. Le plafond de 50 de `listUsers()` a été supprimé, mais un plafond de 1000 subsiste. Sans conséquence aujourd'hui — tous les appelants passent des lots de 200 au maximum, bornés en amont par les `.limit(200)` du collecteur — mais **le motif ne doit pas être réutilisé tel quel** pour une résolution de volume non borné. Voir la section sur `max_rows`.

---

## Sujet 3 — Collecteur lifecycle : détection d'auteur faussée (fait)

**Gravité : P1 — corrigé le 8 août 2026.** Problème 4 de l'audit.

### Le problème d'origine

`lib/cron/lifecycle-collector.ts` décidait qui reçoit la relance « Publiez votre première annonce » en chargeant les `author_membership_id` des trois tables de contenu **de toute la plateforme**, puis en vérifiant si les memberships du lot de 200 profils s'y trouvent. Trois défauts se cumulaient.

**Un plafond écrit en dur.** Les trois requêtes portaient un `.limit(1000)` explicite. Ce n'était donc pas la troncature PostgREST — relever `max_rows` n'y aurait strictement rien changé. Dès que la plateforme dépasse 1000 contenus, une partie des auteurs devenait invisible à la détection.

**Aucun `ORDER BY`.** Le sous-ensemble de 1000 lignes renvoyé était arbitraire et **changeait d'un run à l'autre**. Le bug n'était pas « au-delà de 1000 contenus, certains auteurs sont mal classés une fois pour toutes » : c'était un tirage au sort quotidien.

**Le tirage était répété jusqu'à 27 fois par utilisateur.** Un profil n'était marqué (`engagement_reminder_sent_at`) que s'il était jugé *éligible*. Un auteur correctement détecté restait donc non marqué et repassait dans la moulinette à chaque run.

### Problèmes découverts en cours de correction

**La famine du lot de 200.** Les profils inéligibles (ayant déjà publié) occupaient des places dans le lot, repoussant les candidats réels. Sans `ORDER BY`, les plus anciens — ceux dont la fenêtre de 30 jours expire en premier — n'étaient jamais atteints.

**Le silence sur les erreurs de lecture.** Les requêtes de contenu ignoraient `error` : si l'une échouait (réseau, timeout), l'ensemble des auteurs était vide et **tout le lot de 200** était classé « sans contenu », déclenchant des relances absurdes. Ce mode de panne était plus coûteux que la troncature d'origine.

### La correction

Réécriture complète de la sélection : deux fonctions SQL (`select_engagement_candidates`, `select_notification_activation_candidates`) remplacent le croisement en mémoire. La jointure SQL supprime d'un coup la troncature, la famine, et le silence sur les erreurs. Les fonctions sont `security definer` et restreintes à `service_role` uniquement, car elles révèlent qui n'a rien publié.

Migration `20260808164016_lifecycle_candidate_rpcs.sql`.

Bonus collatéral : un `NOT EXISTS` sur `email_queue` rend l'envoi idempotent par construction — plus de double-relance possible.

De plus, chaque phase du cron est désormais isolée dans son propre `try/catch`, de sorte qu'un échec d'une phase ne bloque plus les suivantes. Les phases en échec sont remontées dans la réponse JSON et déclenchent l'alerte cron-job.org.

### Critère d'acceptation (vérifié)

- `lib/cron/lifecycle-collector.test.ts` couvre les cas : appel RPC avec bonnes bornes, pas de lecture directe des tables de contenu, erreur RPC remontée, erreur d'insertion remontée, opt-out e-mail respecté mais push envoyé, isolation des phases.
- `npm test`, `npm run lint` et `npm run build` passent sans nouvelle erreur.

### Reste à faire (second commit)

`purgeArchivedConversations` boucle sur chaque `conversation_id` distinct avec un `COUNT` séparé pour détecter les orphelines. C'est un N+1 non borné sur un chemin cron. À corriger dans un commit séparé (partie destructive). Voir la todo `purge-conversations` du plan.

---

## Sujet 4 — Fan-out notifications (fait)

**Gravité : P0 — corrigé le 8 août 2026.** Problèmes 2a et 3 de l'audit.

### Le problème d'origine

Trois défauts cumulés dans `lib/services/notification-fanout.ts`.

**a. 414 URI Too Long dès ~217 membres actifs.** Le filtre `.in()` sur `user_notification_preferences` construisait une URL de requête. Avec ~217 UUID (8 Ko), PostgREST renvoyait 414, que `supabase-js` traduisait en `{ data: null }` sans erreur. La ligne 72 ne lisait que `data` → l'ensemble des opted-out était vide → **tout le monde était notifié, y compris qui avait refusé**. C'était le seuil le plus proche de l'audit, et le mode de panne le plus grave : une violation du consentement.

**b. Troncature à 1000 membres.** La sélection des memberships actifs n'avait ni `.limit()` ni `.range()`. Au-delà de `max_rows`, les suivants n'étaient jamais notifiés.

**c. Saturation du pool PostgREST.** Un `notifyUser` par destinataire via `Promise.all`, chacun créant son propre client service-role, avec un insert dans `notifications` et un select sur `push_subscriptions`. Pour 2000 membres, ~4000 requêtes simultanées.

### La correction

1. **RPC SQL `select_content_notification_recipients`** — jointure `memberships LEFT JOIN user_notification_preferences`, avec case/coalesce sur le type de contenu et pagination par curseur. La limite d'URL disparaît car le filtrage se fait en base, pas en JS avec `.in()`. Migration `20260808173511_fanout_notification_recipients_rpc.sql`.

2. **Pagination par pages de 150** — bien en dessous de 8 Ko et de `max_rows`, donc tout `.in()` construit à partir d'une page est sûr par construction.

3. **Client service-role avec `persistSession: false, autoRefreshToken: false`** — supprime le ticker de 30 s et la rétention de 11,2 Ko par client pour tous les appelants (`lib/supabase/server.ts`).

4. **Livraison groupée par page** — insert groupé dans `notifications`, select groupé sur `push_subscriptions`, nouvelle fonction `sendPushToSubscriptions` avec concurrence bornée (~20 en parallèle), delete groupé des abonnements périmés.

5. **Observabilité** — le fan-out retourne et logue un compte rendu (destinataires, notifications insérées, push envoyés/échoués, durée).

6. **Fin du fire-and-forget** — les cinq appels `void fanoutNewContentNotification` dans les server actions utilisent désormais `after()` de `next/server` (garantit l'achèvement). Les six `void notifyUser` du cron lifecycle sont remplacés par des await à concurrence bornée, avec remontée des échecs dans `failedPhases`.

7. **Même traitement pour `initiative-to-event-notification.ts`** — batching des queries, concurrence bornée pour les push.

### Tests

- `lib/services/notification-fanout.test.ts` réécrit sur la nouvelle surface RPC : 10 cas couvrant les paramètres du RPC, la pagination multi-pages, les erreurs RPC.
- `tests/integration/notification-fanout.itest.ts` : commune de 1200 memberships actifs dont 100 en opt-out, vérification du nombre exact de destinataires (1099).
- `lib/cron/lifecycle-collector.test.ts` mis à jour pour le nouveau type de retour `PhaseResult`.

### Note sur le sujet 8

La roadmap mentionnait que la décision du sujet 8 (rétention de la table `notifications`) devait précéder le sujet 4. Cette dépendance a été retirée : remplacer une boucle d'inserts par un tableau d'inserts est trivial à défaire, et le retard de la décision produit ne justifiait pas de laisser le bug de consentement ouvert.

---

## Sujet 5 — `email_queue` sans réservation

**Gravité : P2** (rétrogradé depuis P1 le 8 août 2026 — voir réévaluation ci-dessous). Problème 6 de l'audit.

### Le problème

`lib/cron/email-sender.ts:54` lit les lignes `pending` et les traite **sans les marquer**. Le cron tourne toutes les 2 minutes ; un run qui dépasse ce délai chevauche le suivant, et **les deux envoient les mêmes e-mails**. Réputation SMTP et plaintes à la clé.

Le diagnostic reste juste : le code est incorrect par construction. Il repose sur l'hypothèse implicite que chaque run se termine avant le suivant, sans le vérifier.

### Réévaluation post-sujet 2 (8 août 2026)

Le classement P1 initial supposait que `shouldSend` appelait `listUsers()` (potentiellement des dizaines de secondes). Ce n'est plus le cas : depuis le sujet 2, `shouldSend` est une requête `.maybeSingle()` qui prend quelques millisecondes.

**Estimation d'un run après correction :** batch de 10 × (500 ms délai + ~50 ms DB + temps SMTP) ≈ **8–12 secondes**. Intervalle cron : **120 secondes**. Facteur de sécurité : **10× à 15×**.

**Volume d'alimentation :** le collecteur lifecycle insère au maximum ~1400 lignes/jour (7 phases × 200 max). À 10/batch et 30 runs/heure, le backlog se vide en ~5 heures. Aucun run ne chevauche le suivant à ce rythme.

Le chevauchement devient réaliste dans trois cas :
- **SMTP lent ou bloqué** : un relay en timeout sur un e-mail peut retenir le run au-delà de 2 minutes.
- **Augmentation du batch** : un opérateur qui passe `CRON_EMAIL_BATCH_SIZE=50` pour vider un backlog n'a aucun signal que ça active le double-envoi.
- **Timeout serverless** : sur Vercel (60 s en plan Pro), un run qui dépasse le timeout est tué. Les e-mails déjà envoyés mais pas encore marqués `sent` restent `pending` → renvoyés au prochain run.

### Angle mort : crash mid-send

Ni un advisory lock ni `FOR UPDATE SKIP LOCKED` ne protègent contre le scénario le plus probable après le sujet 2 : un e-mail est envoyé au relay SMTP, le run est interrompu avant d'écrire `status = 'sent'`, et l'e-mail est renvoyé au cycle suivant. C'est le problème d'**at-least-once delivery** inhérent à tout système qui découple l'envoi de la confirmation.

Ce risque est acceptable au volume actuel. Sa résolution complète nécessiterait une clé d'idempotence côté SMTP (header `Message-ID` ou idempotency key selon le relay), ce qui est un chantier distinct et disproportionné pour l'instant.

### La correction — en deux phases

**Phase 1 (faite le 8 août 2026) — lock-row avec TTL.**

> **Pourquoi pas un advisory lock ?** Les advisory locks session-level (`pg_try_advisory_lock`) sont liés à la **connexion Postgres**, pas au client HTTP appelant. Via PostgREST, chaque requête `supabase-js` peut obtenir une connexion différente du pool — le lock acquis dans un premier `.rpc()` est perdu dès que la connexion retourne au pool. Pire : si un autre run récupère la même connexion, le lock est réentrant et les deux runs pensent l'avoir. Advisory locks sont donc inutilisables dans cette architecture.

La solution implémentée utilise une table `cron_locks` avec deux RPCs :

- `try_acquire_cron_lock(p_name, p_ttl_minutes)` : renvoie un `lock_id` si le lock est disponible (ou expiré depuis `p_ttl_minutes`), `NULL` sinon.
- `release_cron_lock(p_name, p_lock_id)` : libère le lock **seulement si** le `lock_id` correspond (protège contre une release tardive qui écraserait un lock volé par TTL).

Le TTL de 5 minutes garantit qu'un crash ne bloque pas les runs suivants indéfiniment. Après un crash, 2-3 runs sont sautés (acceptable pour des emails lifecycle non urgents).

Migration : `20260808161820_cron_locks.sql`. Fichiers modifiés : `lib/cron/email-sender.ts`, `lib/cron/email-sender.test.ts`.

**Phase 2 (différée) — `claim_email_batch`.** Le RPC `FOR UPDATE SKIP LOCKED` devient pertinent quand la durée mesurée d'un run dépasse 30 % de l'intervalle cron, ou quand le batch size doit monter au-delà de 20.

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

La phase 2 implique : nouveau status `processing` dans le CHECK constraint, migration, et **reprise des `processing` bloqués depuis plus de 10 minutes** (sinon un crash gèle des lignes définitivement). `FOR UPDATE SKIP LOCKED` ne peut pas être testé via PostgREST (chaque requête `supabase-js` est une transaction distincte) — vérifier par test d'intégration psql ou test unitaire de la logique de réservation.

### Critère d'acceptation

**Phase 1 (vérifié) :** le run sort immédiatement avec un résultat `{ sent: 0, skipped: true }` quand un autre run est en cours. 4 nouveaux tests dans `lib/cron/email-sender.test.ts` couvrent le mécanisme de lock (skip, acquire/release, release on error, release on empty queue). Les 9 tests existants de la machine à états passent sans modification des assertions.

**Phase 2 :** `lib/cron/email-sender.test.ts` complété par le nouvel état `processing`. Les transitions existantes (cancelled, sent, pending→retry, failed) restent identiques.

### Note annexe

~~`getDelayMs()` évalue `parseInt(val) || DEFAULT_DELAY_MS` : `parseInt("0")` renvoie `0` (falsy), donc `0 || 500` donne 500 ms — une valeur `CRON_EMAIL_DELAY_MS=0` est silencieusement ignorée.~~ **Corrigé le 8 août 2026** : le test utilise désormais `!isNaN(parsed)` au lieu du `||`. `CRON_EMAIL_DELAY_MS=0` fonctionne et les tests utilisent cette valeur.

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

## Sujet 7 — Agrégats et filtres calculés en JS

**Gravité : P1.** Problèmes 2b, 8 et 9 de l'audit.

### Le problème

**a. Filtres de la liste utilisateurs** — `listUsersPage` (`lib/queries/backoffice-users-list.ts:119-164`) construit ses filtres commune, rôle et statut en chargeant **toutes** les lignes `memberships` correspondantes sans limite, puis en les intersectant en JS. Chacune de ces trois lectures est tronquée à `max_rows` : au-delà, des utilisateurs disparaissent silencieusement de la liste **et** du `totalCount` affiché à côté.

C'est le seuil le plus proche de la liste. Le filtre par statut (ligne 151) n'a même pas de scope commune : il se déclenche à 1000 memberships **au niveau plateforme**, soit bien avant les 1000 membres actifs d'une seule commune du sujet 4. Et contrairement aux points b et c ci-dessous, il ne s'agit pas d'un chiffre indicatif sur un tableau de bord mais d'une liste sur laquelle des opérateurs agissent : suspendre, bannir, changer un rôle.

**b. Compteurs de participation** — `listVolunteerCountsByEventId` et `listParticipantCountsByEventId` (`lib/queries/events.ts:103-137`) rapatrient toutes les lignes de participation pour en faire un `.length`. Même schéma pour les soutiens d'initiative et `fetchReportCountByContext`. Double peine : coût réseau inutile, et **compteur faux** dès que le total dépasse `max_rows`.

**c. Stats backoffice** — `getContentPopulationStats` (`lib/queries/backoffice-contenus.ts`) et `getPopulationStats` (`lib/queries/backoffice-users-list.ts`) chargent des tables entières **sans filtre de commune ni limite** pour agréger en JS.

Précisions qui aggravent le diagnostic :

- `getPopulationStats` charge **4 jeux non bornés** : `communes`, `memberships`, et `neighbor_invites` **deux fois** (`.select("commune_id")` complet, puis à nouveau filtré sur `accepted_at`).
- Les deux fonctions restreignent aux communes pilotes **en JS après la récupération** (`filterPilotRows`, `countByCommuneId`). La troncature intervient donc **avant** le filtre — les statistiques deviennent silencieusement fausses dès que **la plateforme** dépasse le plafond, pas seulement dès qu'une commune le dépasse. Même mécanisme qu'en **a**, sur un écran de pilotage.
- `getContentPopulationStats` est appelée sur **deux pages** en `force-dynamic` (`backoffice/admin` et `backoffice/contenus?tab=stats`), sans cache pour amortir.

`listPilotCommunesPage` charge toutes les communes puis pagine avec `.slice()`. Les TODO sont déjà dans le code.

### La correction

Pour **a**, pousser le filtre en SQL au lieu de l'intersecter en JS : une jointure ou un `.in()` sur une sous-requête, de sorte que la pagination de `profiles` porte sur l'ensemble filtré et non sur une intersection tronquée. C'est le seul des trois points qui corrige une **liste d'action**, pas un affichage.

Pour **b** et **c**, des RPC d'agrégation : `COUNT(*) ... GROUP BY event_id` d'un côté, `GROUP BY commune_id` de l'autre, et une pagination SQL réelle pour la liste des communes. Ce sont des RPC **nouveaux**, donc aucun risque sur l'existant tant que le remplacement est fait requête par requête. Attention à la forme du retour : un RPC `returns table` reste soumis à `max_rows`, ce qui est sans conséquence pour un agrégat groupé par commune, mais le redeviendrait pour un groupement par événement sur un gros volume.

### Critère d'acceptation

Pour **a** : un test qui applique un filtre statut sur un jeu dépassant le plafond et vérifie que le `totalCount` correspond au nombre réel. La troncature étant silencieuse, aucun garde-fou existant ne l'attrapera.

Pour **b** et **c** : une ligne de résultat par événement au lieu d'une par participant, et le bloc 8 du snippet ne fait plus apparaître ces requêtes.

---

## Sujet 8 — Rétention des tables append-only

**Gravité : P2.** Problème 10 de l'audit.

### Le problème

**`notifications` est une table en écriture seule** : elle n'est référencée qu'une seule fois dans tout le code, par un `insert` (`lib/services/push-notifications.ts:132`). Aucune lecture, nulle part, et pas de centre de notifications dans l'UI. Avec le fan-out, 20 communes × 1000 membres × 10 contenus/jour produisent **200 000 lignes par jour que personne ne consulte**.

Même constat, sans purge, pour `audit_logs` et les lignes `sent` de `email_queue`.

> **Cas particulier : `analytics_events`** — Cette table est **vide** en production (0 ligne, 0 octet au 8 août 2026). La route `app/api/analytics/route.ts` et le helper `lib/analytics/track.ts` existent, mais `track()` n'est **appelé depuis aucun composant**. Le pipeline analytics est un échafaudage jamais branché. La question à trancher ici est la même que pour `notifications` — connecter le pipeline ou supprimer le code mort (route, helper, table, index). Elle doit être tranchée **avant** d'écrire une politique de rétention.

### La correction

**Trancher d'abord la question de l'UI**, parce qu'elle détermine la correction :

- Si le centre de notifications doit exister → mettre en place une rétention (lues > 90 j, non lues > 180 j) et un index partiel sur les non-lues.
- S'il ne doit pas exister → **arrêter d'écrire**.

Dans les deux cas, ajouter une phase de purge au cron lifecycle existant plutôt que de créer un nouveau cron.

### Ordre

**Pas de dépendance avec le sujet 4** (désormais fait). La décision sur la table `notifications` — garder avec rétention, ou cesser d'alimenter — reste à prendre, mais elle ne bloque plus rien.

Si la décision est de garder la table, dimensionner la rétention sur le volume réel produit par le fan-out corrigé.

La même logique s'applique à `analytics_events` : trancher « connecter ou supprimer » avant d'écrire quoi que ce soit.

### Critère d'acceptation

Pour la décision : une ligne dans ce document qui tranche, datée. C'est une décision produit, elle n'a pas de critère technique.

Pour la purge : les blocs 5 et 6 du snippet donnent la volumétrie et le volume purgeable avant / après.

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

### e. Table de préférences orpheline (P3)

Deux tables de préférences de notification coexistent :

| Table | Créée le | Clé vers | Colonnes | Lignes prod |
| --- | --- | --- | --- | --- |
| `profile_notification_preferences` | 5 juin (`20260605000010`) | `profiles(user_id)` | 3 | **0** |
| `user_notification_preferences` | 14 juin (`20260614000000`) | `auth.users(id)` | 10 | 42 |

La première n'est écrite que par `updateNotificationPreferences` dans `lib/actions/profile.ts:14` — un **doublon mort**. L'UI (`components/features/notification-preferences-form.tsx`) importe la fonction **homonyme** de `lib/actions/notifications.ts`, qui écrit dans `user_notification_preferences`. Deux server actions de même nom dans deux fichiers voisins, dont une jamais atteinte : piège pour la prochaine modification des préférences.

`docs/database-erd.md` ne documente déjà que `user_notification_preferences`.

*Correction :* supprimer l'action morte de `profile.ts`, puis migration `DROP TABLE public.profile_notification_preferences` (avec ses 4 policies et son trigger).
