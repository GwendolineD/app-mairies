# Message aux inscrit·es d'un événement — analyse et options

> Rédigé le 9 octobre 2026. Statut : **analyse, aucune décision prise, aucun code modifié**.
> Périmètre : listes de bénévoles et de participants d'un événement (et, par symétrie, soutiens d'une initiative).

---

## 1. Besoin exprimé

L'auteur·e d'un événement voit un bouton « Contacter » sur chaque ligne des listes de bénévoles et de participants. Pour prévenir 10 inscrit·es d'un changement (horaire, lieu, quoi apporter…), il faut aujourd'hui 10 ouvertures de modale et 10 copier-coller.

Idée initiale : **un bouton « Envoyer à tous les inscrits »** qui ouvre une seule modale ; à l'envoi, le système crée **N conversations 1:1** (une par inscrit·e) contenant le même message.

---

## 2. Constat sur l'existant — le bouton « Contacter » individuel ne fonctionne pas pour l'auteur·e

Avant toute fonctionnalité groupée, un défaut bloquant a été identifié.

### 2.1 Symptôme

Dans `event-participants-list.tsx`, `event-volunteers-list.tsx` et `initiative-supporters-list.tsx`, la ligne d'un·e inscrit·e rend :

```tsx
<ContactAnnouncementButton
  contextId={eventId}
  contextType="event"
  label="Contacter"
  …
/>
```

Seul `eventId` est transmis. **L'identité de la personne ciblée n'est jamais envoyée.**

### 2.2 Cause

`ContactAnnouncementButton` appelle `sendContextMessage` → `ensureConversation(contextType, contextId)` (`lib/actions/messages.ts`). Cette fonction résout systématiquement **l'auteur·e du contenu** comme destinataire. Quand c'est l'auteur·e qui clique, elle retombe sur :

```ts
if (authorUserId === ctx.userId) {
  return { error: "Vous ne pouvez pas vous contacter vous-même", conversationId: null };
}
```

Résultat : l'auteur·e qui tente de contacter un·e participant·e obtient une erreur. Le bouton est affiché (`showContactButton={isAuthor}`) mais inopérant.

### 2.3 Contrainte de modèle

Le type `EventVolunteer` (`lib/queries/events.ts`) expose `membershipId`, `firstName`, `lastName`, `displayName`, `avatarUrl` — **pas de `userId`**. Or `conversations` est clé par `participant_a` / `participant_b` (= `auth.users.id`).

### 2.4 Prérequis commun à toutes les options

Une nouvelle action serveur, par exemple `ensureMemberConversation(contextType, contextId, targetMembershipId)` :

1. Session → adhésion active → `commune_id` (ordre imposé par `tous-voisins-multi-tenant.mdc`).
2. Vérifier que l'appelant·e est **l'auteur·e** du contenu (`author_membership_id`).
3. Vérifier que `targetMembershipId` est bien inscrit·e dans ce contenu (`event_participants` ∪ `event_volunteers` / `initiative_supporters`), adhésion active, même commune.
4. Résoudre `user_id` côté serveur depuis `membership_id` (ne jamais faire confiance au client).
5. Réutiliser la logique d'upsert existante (`normalizePair`, index unique `conversations_context_pair_unique`).

L'envoi groupé est la **généralisation** de cette action à N cibles.

---

## 3. Analyse de l'idée initiale : « 1 message → N conversations individuelles »

### 3.1 Points forts

- **Zéro changement de modèle.** `conversations` est strictement 1:1 (`participant_a` / `participant_b`, index unique `(commune_id, context_type, context_id, participant_a, participant_b)`). La boîte de réception, les RPC inbox, l'archivage par participant, le badge non-lus, les push : tout fonctionne tel quel.
- **Expérience destinataire optimale.** Message privé, réponse privée, pas de bruit de groupe. Cohérent avec l'ADN « proximité / bienveillance » de l'app.
- **Faible coût de compréhension** pour les habitant·es : c'est exactement la messagerie qu'ils connaissent déjà.

### 3.2 Performance

**Piège à éviter** : boucler côté Node sur `sendContextMessage`. Chaque appel enchaîne ~6 à 8 allers-retours (select contexte, select membership, select conversation, insert conversation, insert participants, insert message, select préférences, push).

| Inscrit·es | Requêtes séquentielles | Durée estimée | Risque |
|------------|------------------------|---------------|--------|
| 10 | ~70 | 1 à 3 s | Acceptable mais lent |
| 50 | ~350 | 5 à 15 s | Timeout Server Action probable |
| 200+ | ~1 400 | — | Échec garanti |

**Forme recommandée** : une RPC set-based `broadcast_context_message(p_context_type, p_context_id, p_audience, p_body)` (SECURITY DEFINER, `auth.uid()`), qui en une transaction :

1. Vérifie que l'appelant·e est l'auteur·e du contenu et a une adhésion active sur la commune.
2. Résout l'audience en SQL : `event_participants ∪ event_volunteers` (selon `p_audience`) ⋈ `memberships` actives, dédoublonnée sur `user_id`, auteur·e exclu·e, comptes supprimés exclus.
3. Upsert les N conversations via `INSERT … ON CONFLICT (commune_id, context_type, context_id, participant_a, participant_b) DO UPDATE` — **en renseignant `participant_a` / `participant_b`** (voir § 3.3).
4. Insère les N lignes `conversation_participants` manquantes et remet `archived_at = null`.
5. Insère les N messages.
6. Renvoie la liste des `(conversation_id, recipient_user_id)`.

Puis côté TypeScript : un seul `sendPushToSubscriptions(supabase, userIds, payload)` (déjà bulk, concurrence bornée à 20) après filtrage par `notify_message_event`. Ce schéma tient à 500 destinataires.

### 3.3 Maintenabilité

**Manque principal : aucune trace du « lot ».** Sans elle :

- impossible d'afficher « Envoyé à 12 participants » dans un fil ;
- impossible d'avoir un historique des envois groupés ;
- impossible de dédupliquer un double-clic ou un retry réseau (la règle projet exige des mutations idempotentes).

**Recommandation** : table `message_broadcasts` + colonne `messages.broadcast_id`.

```sql
CREATE TABLE public.message_broadcasts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  context_type public.context_type NOT NULL,
  context_id uuid NOT NULL,
  author_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  audience text NOT NULL CHECK (audience IN ('all', 'participants', 'volunteers', 'supporters')),
  body text NOT NULL,
  recipients_count int NOT NULL DEFAULT 0,
  idempotency_key uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now ()
);

ALTER TABLE public.messages ADD COLUMN broadcast_id uuid REFERENCES public.message_broadcasts (id) ON DELETE SET NULL;
```

**Point de vigilance repéré** : il existe aujourd'hui **deux chemins** de création de conversation :

| Chemin | Renseigne `participant_a/b` ? | Utilisé par |
|--------|-------------------------------|-------------|
| `ensureConversation` (TS, `lib/actions/messages.ts`) | Oui | Tous les boutons « Contacter » |
| RPC `get_or_create_context_conversation` (`20260605103000_messaging.sql`) | **Non** | Aucun appelant TS trouvé |

La RPC de broadcast doit impérativement renseigner `participant_a/b`, sinon l'index unique partiel (`WHERE participant_a IS NOT NULL AND participant_b IS NOT NULL`) ne protège rien et on peut créer des doublons.

Ce doublon de logique mériterait une consolidation (hors périmètre, à noter dans la dette).

### 3.4 Expérience utilisateur

**Destinataire** : excellent (voir § 3.1).

**Auteur·e : c'est le point faible.**

- Après l'envoi, sa boîte de réception se remplit de N fils identiques en tête de liste.
- Les réponses arrivent dispersées dans N fils ; impossible d'avoir une vue « qui a répondu / qui a lu ».
- Acceptable à 5–15 inscrit·es, pénible à 40.

**Angle mort structurel** : une personne qui s'inscrit **après** l'envoi ne voit jamais l'information (« apportez un plat », « rendez-vous décalé à 15 h »). Un message est éphémère et ciblé ; une information logistique devrait être **attachée à l'événement**.

### 3.5 Scalabilité et abus

- **Plafond d'audience** (ex. 500) : au-delà, refuser ou basculer en traitement différé.
- **Rate-limit** (ex. 3 envois par contenu et par 24 h) : un·e organisateur·rice peut sinon spammer tous ses inscrit·es sans friction.
- Filtrer les adhésions révoquées et les comptes supprimés (`participant_b IS NULL` après `ON DELETE SET NULL`).
- Respecter `notify_message_event` **pour le push uniquement** — le message est toujours déposé dans la messagerie (le choix de préférence concerne la notification, pas la réception).
- Tenant : `commune_id` partout (RPC, table de lot, filtre audience).

### 3.6 Verdict

**Viable**, à condition de passer par une RPC set-based et une table de lot. Mais ce n'est pas nécessairement la meilleure réponse au besoin réel (informer les inscrit·es), voir § 4.

---

## 4. Options alternatives

### Option B — « Info aux inscrit·es » : publication + notification, sans conversation

L'auteur·e poste une information courte **rattachée à l'événement**.

- **Stockage** : nouvelle table `content_updates (id, commune_id, context_type, context_id, author_membership_id, body, created_at)`.
- **Affichage** : bloc « Infos de l'organisateur·rice » sur la page du contenu, historique daté, visible de tout le monde (y compris les futurs inscrit·es).
- **Notification** : nouveau `kind: "content_update"` dans `notifications` + push, via la mécanique de fan-out existante (`lib/services/notification-fanout.ts`) restreinte aux inscrit·es au lieu de toute la commune.
- **Réponse** : l'inscrit·e utilise le « Contacter l'organisateur·rice » existant — qui fonctionne déjà, puisque c'est le destinataire qui initie.

| Critère | Évaluation |
|---------|------------|
| Performance | 1 insert + fan-out bulk déjà écrit. Excellent. |
| Maintenabilité | Réutilise le centre de notifications tout juste livré. Une table, un `kind`, une préférence. |
| UX auteur·e | Zéro pollution d'inbox. Historique lisible. |
| UX inscrit·e | Notification claire, info retrouvable sur la page. |
| Retardataires | Couverts (l'info est sur la page). |
| Limites | Moins « conversationnel » ; pas de garantie de lecture ; pas de réponse en un tap depuis la notification (il faut passer par la page). |

**Impact migration** : `notifications_kind_check` (figé dans `20261008210000_notifications_center.sql`) doit accepter `content_update` ; `NOTIFICATION_KINDS` dans `lib/constants/notification-kinds.ts` à mettre en miroir. Nouvelle préférence `notify_content_update` ou réutilisation de `notify_message_event` (à trancher).

### Option C — Conversation de groupe

**À écarter maintenant.** Tout le modèle suppose du 1:1 : paire unique, `other_user_id` calculé par `CASE WHEN participant_a = auth.uid()` dans toutes les RPC inbox (`list_my_conversations*`), archivage par participant, affichage « Ancien voisin » sur compte supprimé. C'est une refonte de la messagerie, pas une fonctionnalité.

### Option D — Hybride (recommandation)

Option B comme socle, avec dans la même modale une case **« Envoyer aussi en message privé à chacun·e »** (décochée par défaut — nudge par défaut vers le chemin sans bruit).

- Décochée (90 % des cas : horaire, lieu, quoi apporter) → info publiée + notification.
- Cochée (l'organisateur·rice veut ouvrir le dialogue) → en plus, RPC de broadcast (option A) avec `broadcast_id`.
- Le bouton « Contacter » par ligne, réparé, reste disponible pour le cas « je veux parler à une seule personne ».

**Ordre de livraison suggéré** :

1. Réparer le « Contacter » individuel (§ 2.4) — prérequis, correctif pur.
2. Option B.
3. Case « aussi en privé » (option A) si le besoin se confirme à l'usage.

---

## 5. Parcours utilisateurs

### Parcours 1 — Contacter une personne (correctif)

**Mobile** : page événement → carte « Participants » → tap sur la rangée d'avatars → sheet « 12 participants » → « Contacter » sur une ligne → sheet « Message à Gwendoline » (textarea, Annuler / Envoyer) → toast « Message envoyé ! » + « Voir la conversation ».

**Desktop** : identique, en dialog centré.

Seule différence avec aujourd'hui : le message part réellement vers la bonne personne, et la modale est titrée au prénom de la personne (aujourd'hui « Contacter »).

### Parcours 2 — Info aux inscrit·es (option B)

**Point d'entrée** : carte « Gérez votre événement », bouton « Écrire aux inscrit·es ». Visible si `participantsCount + volunteersCount > 0` ; sinon désactivé avec hint « Les premières inscriptions arriveront bientôt ».

**Modale (1 écran)** :

- Titre : « Info pour vos 12 inscrit·es ».
- Audience : chips « Tous · Participants · Bénévoles », « Tous » par défaut, le compteur se met à jour.
- Textarea, placeholder orienté usage : « Rendez-vous décalé à 15 h, pensez à apporter… ».
- Brouillon persisté en `localStorage` (règle projet pour les formulaires en modale).
- CTA : **« Envoyer à 12 personnes »** — le chiffre dans le bouton est le garde-fou, pas de confirmation supplémentaire.

**Résultat** : toast « Info envoyée à 12 voisin·es ! ». L'info apparaît dans un bloc « Infos de l'organisateur·rice » daté sur la page de l'événement.

**Côté inscrit·e** : notification « Marie a une info pour « Repas de quartier » » → tap → page de l'événement, ancrée sur l'info, bouton « Contacter Marie » juste en dessous pour répondre en privé.

**Mobile** : bottom sheet, CTA dans la zone du pouce. **Desktop** : dialog, bloc d'infos en colonne principale, sidebar inchangée.

### Parcours 3 — Message groupé en conversations (option A seule, ou case de l'option D)

Même point d'entrée, même modale, avec la case « Envoyer aussi en message privé à chacun·e ».

**Après envoi** : toast « Message envoyé à 12 voisin·es », puis redirection vers la messagerie **filtrée sur cet événement** (sans ce filtre, l'inbox devient illisible).

**Dans chaque fil 1:1** : le premier message porte un marqueur discret « Envoyé à 12 participants » (grâce à `broadcast_id`). Évite au destinataire de croire à un message personnel, et à l'auteur·e de se perdre dans ses propres fils.

**Côté inscrit·e** : push « Nouveau message — Marie · Repas de quartier » → fil 1:1 → réponse privée, comme aujourd'hui.

---

## 6. Impacts techniques par option

| Élément | Correctif (§ 2) | Option A | Option B | Option D |
|---------|-----------------|----------|----------|----------|
| Nouvelle action serveur | `ensureMemberConversation` | `broadcastContextMessage` | `publishContentUpdate` | B + A |
| Migration SQL | Aucune | `message_broadcasts`, `messages.broadcast_id`, RPC `broadcast_context_message` | `content_updates`, `kind` `content_update`, préférence notif | Les deux |
| Types générés | Non | Oui | Oui | Oui |
| Fan-out / push | Existant (`sendPushToUser`) | `sendPushToSubscriptions` | Fan-out existant adapté (cible = inscrit·es) | Les deux |
| Messagerie (inbox) | Aucun | Filtre par contexte + marqueur « lot » | Aucun | Idem A |
| Page contenu | Aucun | Aucun | Bloc « Infos de l'organisateur·rice » | Bloc |
| Centre de notifications | Aucun | Aucun | Nouveau `kind` + visuel + route | Idem B |
| Cron rétention | Aucun | Purge des lots orphelins ? | Suppression en cascade avec le contenu (trigger existant à étendre) | Les deux |
| Tests d'intégration | Autorisation (auteur ≠ cible, cible inscrite, même commune) | Idempotence, audience, plafond, rate-limit | Fan-out ciblé, visibilité, cascade | Les deux |

---

## 7. Risques et points à trancher

1. **Correctif prérequis** : ajouter `userId` dans `EventVolunteer` / `InitiativeSupporter` **ou** résoudre côté serveur depuis `membershipId` (plus sûr, recommandé — on n'expose pas d'identifiants d'utilisateur au client).
2. **Option B et le CHECK `notifications_kind_check`** : si la migration `20261008210000_notifications_center.sql` n'est pas encore appliquée en production, intégrer `content_update` dès maintenant évite une migration de plus.
3. **Préférence de notification** : nouvelle colonne `notify_content_update` (plus précis, un toggle de plus dans l'UI) ou réutilisation de `notify_message_event` (plus simple, sémantique un peu étirée).
4. **Garde-fous obligatoires** quelle que soit l'option : plafond d'audience, rate-limit par contenu, exclusion des adhésions révoquées et comptes supprimés, idempotence (clé de lot ou bouton désactivé pendant l'envoi).
5. **Initiatives** : les soutiens ont exactement la même structure que les participants. Concevoir la fonctionnalité au niveau `contextType` dès le départ, pas spécifique « événement ».
6. **Dette repérée** : deux chemins de création de conversation (TS vs RPC `get_or_create_context_conversation`) dont un ne renseigne pas `participant_a/b`. À consolider indépendamment.
7. **Modération** : un message groupé ou une info publiée doit être signalable comme tout autre contenu (`ReportButton` existant à brancher sur `content_updates` si option B).

---

## 8. Fichiers concernés (lecture faite pour cette analyse)

| Fichier | Rôle |
|---------|------|
| `components/features/event-participants-list.tsx` | Liste participants + bouton « Contacter » (défaut § 2) |
| `components/features/event-volunteers-list.tsx` | Liste bénévoles (idem) |
| `components/features/initiative-supporters-list.tsx` | Liste soutiens (idem) |
| `components/features/contact-announcement-button.tsx` | Modale de contact, appelle `sendContextMessage` |
| `components/features/event-sidebar-actions.tsx` | Cartes sidebar événement — point d'entrée naturel pour « Écrire aux inscrit·es » (carte `AuthorActionsCard`) |
| `lib/actions/messages.ts` | `ensureConversation`, `insertConversationMessage`, `sendContextMessage` |
| `lib/queries/events.ts` | `EventVolunteer`, `listEventMemberRows` (pas de `userId`) |
| `lib/services/push-notifications.ts` | `sendPushToUser`, `sendPushToSubscriptions`, `notifyUser`, `shouldNotifyMessage` |
| `lib/services/notification-fanout.ts` | Fan-out bulk paginé (réutilisable pour option B) |
| `lib/constants/notification-kinds.ts` | `NOTIFICATION_KINDS` (miroir du CHECK SQL) |
| `lib/validations/schemas.ts` | `messageSchema` (`body` 1–5000) |
| `supabase/migrations/20260605103000_messaging.sql` | Trigger `handle_new_message`, RPC `get_or_create_context_conversation` |
| `supabase/migrations/20260529000000_resident_features.sql` | `participant_a/b`, index unique `conversations_context_pair_unique` |
| `supabase/migrations/20261008210000_notifications_center.sql` | `notifications_kind_check`, `commune_id NOT NULL` |
| `docs/plan-notification-center.md` | Référence centre de notifications (option B s'y greffe) |
