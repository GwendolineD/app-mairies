# Audit Sécurité, Performance & Architecture — Tous Voisins

**Date** : 2 juillet 2026  
**Périmètre** : audit statique du dépôt (`app-mairies.nosync`) — Next.js 16, Supabase, ~525 fichiers  
**Objectif** : identifier les vulnérabilités, goulots de performance et faiblesses architecturales

---

## Table des matières

1. [Synthèse exécutive](#synthèse-exécutive)
2. [Sécurité](#sécurité)
3. [Performance](#performance)
4. [Architecture](#architecture)
5. [Plan d'action recommandé](#plan-daction-recommandé)

---

## Synthèse exécutive

| Domaine | Verdict | Risques critiques |
|---------|---------|-------------------|
| **Sécurité** | Solide — fondations bien posées | 1 faille élevée (IDOR invitations), risque modéré sur trial code |
| **Performance** | Correcte — patterns bons, hot paths à optimiser | Session non dédupliquée, requêtes carte non bornées, compteur unread coûteux |
| **Architecture** | Bien structurée — separation of concerns claire | Double shell backoffice |

### Score global

| Critère | Note /5 | Commentaire |
|---------|---------|-------------|
| Auth & autorisation | 4/5 | Guards layout + RLS ; quelques server actions non protégées |
| Protection des données | 4/5 | RLS exhaustif ; trial code accessible aux authenticated (choix documenté) |
| Validation des entrées | 4/5 | Zod généralisé ; URLs médias trop permissives |
| Headers & transport | 4/5 | HSTS, X-Frame-Options, nosniff ; CSP manquante |
| Requêtes DB | 3/5 | Pagination OK mais hot paths coûteux |
| Bundle & rendu | 4/5 | Code-splitting maîtrisé |
| Caching | 3.5/5 | `unstable_cache` sur référentiels ; session non cachée |
| Scalabilité | 4/5 | Multi-tenant cohérent ; index et agrégations à renforcer |

---

## Sécurité

### Points forts

- **RLS activé sur toutes les tables** avec policies granulaires (staff, member, admin)
- **Triggers anti-élévation de privilèges** (`protect_profile_sensitive_columns`, `protect_membership_sensitive_columns`) — bloquent la modification de `is_platform_admin` et les auto-promotions de rôle
- **Guards centralisés** (`requireAuth`, `requireActiveMembership`, `requireCommuneStaff`, `requirePlatformAdmin`) dans `lib/auth/session.ts`
- **Service role key** jamais exposée côté client ; uniquement dans `lib/supabase/server.ts`, cron, scripts
- **Upload sécurisé** : whitelist MIME, taille max 5 Mo, scan antivirus ClamAV, dossier Cloudinary scoped par utilisateur
- **Sanitisation HTML** via `isomorphic-dompurify` sur tout contenu admin affiché avec `dangerouslySetInnerHTML`
- **Protection open redirect** sur `/auth/callback`
- **Headers sécurité** : X-Frame-Options DENY, nosniff, HSTS, Permissions-Policy restrictive

### Vulnérabilités identifiées

#### [MOYENNE] Code trial accessible aux utilisateurs authentifiés

| | |
|---|---|
| **Fichier** | `supabase/migrations/20260625200000_hide_trial_code_column.sql` |
| **Décision** | Intentionnel — le commentaire migration documente que `authenticated` conserve l'accès, le code résident ne sélectionne jamais cette colonne |
| **Risque résiduel** | Un utilisateur malveillant pourrait interroger manuellement `communes.trial_access_code` via DevTools pour obtenir le code d'une commune trial et le partager sans autorisation |
| **Évaluation** | Risque **modéré** — l'utilisateur est déjà authentifié (inscrit), le code trial ne sert qu'à l'inscription initiale |
| **Recommandation optionnelle** | Si le risque de partage non autorisé est jugé inacceptable : vue `communes_public` sans la colonne pour `authenticated`, accès via RPC staff-only |

#### [ÉLEVÉE] IDOR sur invitations trial

| | |
|---|---|
| **Fichier** | `lib/actions/trial-invitation.ts` (l.120–127) |
| **Impact** | Un staff commune A peut envoyer des invitations pour la commune B |
| **Cause** | `requireCommuneStaff()` vérifie le rôle mais pas que `communeId` === commune active du staff |
| **Recommandation** | Ajouter `if (staffCommuneId !== communeId) return error` comme dans `regenerateTrialCodeAsMairie` |

#### [MOYENNE] Server actions sans garde auth (helpers internes)

| Fichier | Fonctions exposées |
|---------|-------------------|
| `lib/actions/municipality.ts` | `resolvePendingReportsForContent`, `resolvePendingReportsForUser`, `markReportsRestoredForContent`, `markReportsRestoredForUser` |

Ces fonctions sont des **helpers internes** appelés exclusivement par `moderation.ts` et `platform-moderation.ts` (qui eux ont les guards `requireCommuneStaff`/`requirePlatformAdmin`). Elles gèrent la résolution batch des signalements lors de suspensions/réactivations de contenus ou utilisateurs. Étant dans un fichier `"use server"`, elles sont techniquement invocables depuis le client, mais **la RLS `reports_update_staff`** bloque toute mutation par un non-staff. Risque quasi nul — écart de convention uniquement. Idéalement, les extraire dans un module utilitaire non-`"use server"`.

#### [MOYENNE] Absence de Content-Security-Policy (CSP)

Aucune directive CSP dans `next.config.ts`. Risque d'injection de scripts inline ou de chargement de ressources externes non contrôlées.

#### [MOYENNE] Rate-limit mémoire — attention si scaling futur

`lib/utils/rate-limit.ts` utilise un store en mémoire. **Sur VPS Coolify (instance unique)**, c'est parfaitement adapté. Ne deviendrait un problème qu'en cas de passage à du scaling horizontal (multi-replicas Docker) ou serverless.

#### [MOYENNE] URLs médias non restreintes à Cloudinary

`photoUrl`, `avatarUrl` dans les schemas Zod acceptent toute URL (`z.string().url()`) — contournement possible du pipeline upload sécurisé. Risques : tracking pixels, contenus inappropriés.

#### [FAIBLE] Antivirus — validation magic bytes manquante

- Configuration prod correcte : `CLAMAV_SERVICE_ENABLED=true`, `CLAMAV_FAIL_MODE=fail_closed`, timeout 30s — **uploads refusés si ClamAV est indisponible**
- Seul point restant : pas de validation des magic bytes (MIME spoofable par le client) — ajouter une vérification des signatures binaires (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`) indépendamment du Content-Type déclaré (~20 lignes)

#### [FAIBLE] `cancellation.ts` — appel `auth.admin` sur client non-service

L.135 utilise `createClient()` (session utilisateur) pour `auth.admin.listUsers()` — échouera silencieusement. Bug fonctionnel plus que faille de sécurité.

#### [FAIBLE] `submitCommuneInterest` — validation minimale

Pas de schema Zod, pas de limite de longueur, pas de rate-limit → risque de spam.

---

## Performance

### Points forts

- **Pagination systématique** sur les listes (20 items par page)
- **Code-splitting** : `dynamic()` pour Leaflet, Recharts, Tiptap
- **`unstable_cache`** sur données référentielles (catégories, settings, legal)
- **`next/image`** utilisé partout (aucun `<img>` brut trouvé)
- **RPC inbox** en 1 round-trip pour les conversations
- **Cron borné** à 500 lignes par exécution

### Problèmes critiques (hot path)

#### P0 — Compteur unread disproportionné

| | |
|---|---|
| **Fichier** | `lib/queries/messages.ts` (l.62–74) |
| **Impact** | Chaque navigation résident charge TOUTES les conversations via RPC + agrège en JS |
| **Coût** | O(conversations × messages) pour un simple badge numérique |
| **Recommandation** | RPC dédiée `count_unread_messages(commune_id)` ou compteur matérialisé trigger-based |

#### P0 — Session non dédupliquée

| | |
|---|---|
| **Fichier** | `lib/auth/session.ts` (l.24–39) |
| **Impact** | `getSessionContext()` exécute 3 requêtes (user + profiles + memberships avec communes) à chaque appel |
| **Aggravant** | Appelé plusieurs fois par requête (layout + page), pas de `cache()` React |
| **Recommandation** | Wrapper `React.cache(getSessionContext)` + `select` ciblé (colonnes minimales). `React.cache` ne déduplique qu'au sein d'un même render RSC — aucun risque de stale data après navigation ou `revalidatePath` |

#### P0 — Support email non caché

| | |
|---|---|
| **Fichier** | `lib/actions/platform-settings.ts` (l.79–86) |
| **Impact** | Requête DB systématique dans le layout résident pour une valeur quasi statique |
| **Recommandation** | `unstable_cache` avec tag `platform-settings` (déjà utilisé ailleurs dans le même fichier) |

### Problèmes élevés (scalabilité)

#### P1 — Requêtes carte sans limite

| Fichier | Fonction |
|---------|----------|
| `lib/queries/announcements.ts` l.164–179 | `listAnnouncementMapItems` — pas de `.limit()` |
| `lib/queries/events.ts` l.67–83 | `listEventMapItems` — `select("*")` sans borne |
| `lib/queries/initiatives.ts` l.178–195 | `listInitiativeMapItems` — idem |

Avec une commune active à 5000+ annonces géolocalisées, ces requêtes deviennent un goulot.

#### P1 — Agrégation dashboard en JS (pas en SQL)

| | |
|---|---|
| **Fichier** | `lib/queries/dashboard-charts.ts` (l.52–93) |
| **Impact** | Charge toutes les lignes `created_at > since`, agrège en mémoire |
| **Recommandation** | `GROUP BY date_trunc(...)` côté SQL |

#### P1 — Double requête count + liste paginée

| | |
|---|---|
| **Fichier** | `lib/queries/announcements.ts` (l.115–123) |
| **Impact** | 2 round-trips DB par page (un count + un select) |
| **Recommandation** | `.select(..., { count: "exact" })` en une requête |

#### P1 — Index manquants

| Colonnes | Usage fréquent | Suggestion |
|----------|---------------|------------|
| `memberships(commune_id, status)` | Filtres habitants, counts dashboard | Index composite |
| `announcements(commune_id, target_date)` | Filtre annonces du jour | Index composite |
| `announcements(commune_id, category_slug)` | Filtres catégories | Index composite |
| `author_membership_id` (announcements/initiatives/events) | Counts backoffice user | Index simple |
| `profiles(first_name, last_name)` | Recherche ILIKE habitants | Index trigram `pg_trgm` |

### Problèmes modérés (bundle & rendu)

#### P2 — Boundary client large sur espace résident

`ResidentShellClient` (`components/features/resident-shell-client.tsx`) enveloppe tout l'espace résident, forçant l'hydratation client sur des contenus potentiellement statiques. L'impact sur le first paint est à évaluer.

---

## Architecture

### Points forts

- **Séparation claire** : `app/` (routes) / `lib/` (logique) / `components/` (UI) / `supabase/` (schéma)
- **Route groups par persona** : `(public)`, `(resident)`, `(municipality)`, `(backoffice)`, `(platform)`, `(suspended)`
- **Multi-tenant strict** : `active_commune_id` sur profile, membership active, filtres `commune_id` applicatifs + RLS
- **Guards par layout** : chaque espace protégé par un guard Server Component
- **Server Actions** comme seul point de mutation (pas de routes API custom sauf upload/cron/analytics)
- **Design system cohérent** : shadcn/ui + wrappers Vie Locale, tokens `globals.css`
- **60 migrations ordonnées** avec progression logique du schéma

### Observations & dette technique

#### Double shell backoffice

`(backoffice)/backoffice/*` et `(platform)/platform/*` coexistent avec le même guard `requirePlatformAdmin`. Migration ou refactoring en cours non terminé — risque de divergence fonctionnelle.

#### `NODE_ENV` custom (`"dev"` / `"prod"`)

`next.config.ts` utilise des valeurs custom `"dev"` et `"prod"` (pas les standards Node `"development"` / `"production"`). Choix assumé pour gérer les comportements conditionnels ngrok/origins — documenter pour les contributeurs.

#### `proxy.ts` (Next.js 16)

Le middleware minimal ne protège pas les routes privées (seulement refresh session + redirect guest). Acceptable mais à documenter : la sécurité repose **exclusivement** sur les guards layout.

#### Rate-limit en mémoire

`lib/utils/rate-limit.ts` : store mémoire process-local. **Adapté à l'architecture actuelle** (VPS Coolify, instance Docker unique). Ne nécessiterait un store distribué (Redis) qu'en cas de scaling horizontal futur.

#### Pas de test automatisé

Aucune suite de tests dans le dépôt. Les invariants de sécurité (RLS, guards, ownership) ne sont validés que par revue manuelle.

#### Schéma riche (60 migrations)

Surface large d'attaque et de maintenance. Recommander une documentation schéma (ERD) pour onboarding et audits futurs.

---

## Plan d'action recommandé

### Priorité 0 — Corrections sécurité urgentes

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Corriger IDOR `sendTrialInvitations` — vérifier `communeId === staffCommuneId` | 30min | Empêche invitations cross-commune |
| 2 | Extraire les helpers `municipality.ts` dans un module non-`"use server"` | 30min | Conformité defense-in-depth |
| 3 | Rate-limit sur `submitCommuneInterest` (anti-spam) | 1h | Protection formulaire public |

### Priorité 1 — Performance hot paths

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 4 | RPC dédiée `count_unread_messages` (SQL simple) | 2h | Élimine le goulot navigation |
| 5 | `React.cache(getSessionContext)` + colonnes minimales | 1h | -3 requêtes/navigation (déduplique dans un même render, pas de risque stale) |
| 6 | `unstable_cache` sur `getPlatformSupportEmail` | 15min | -1 requête/navigation |
| 7 | `.limit()` sur requêtes carte (500 items max) | 1h | Protège contre explosion données |
| 8 | Agrégation SQL dashboard + index manquants | 3h | Scalabilité communes actives |
| 9 | Fusionner count + select paginé (`.select(..., { count: "exact" })`) | 1h | -1 round-trip/page |

### Priorité 2 — Durcissement & hygiène

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 10 | Ajouter CSP dans `next.config.ts` | 2h | Mitigation XSS |
| 11 | Restreindre `photoUrl`/`avatarUrl` à Cloudinary (comme `platform-settings`) | 1h | Ferme le contournement upload |
| 12 | Valider magic bytes uploads (file signature vs MIME déclaré) | 2h | Upload robuste |
| 13 | Passer ClamAV en `fail_closed` en production | ✅ déjà fait | — |
| 14 | Corriger `cancellation.ts` l.135 → `createServiceClient()` | 15min | Bug fonctionnel |

### Priorité 3 — Architecture & maintenabilité

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 15 | Fusionner/clarifier double shell backoffice `(platform)` | 4h | Réduction dette technique |
| 16 | Documentation schéma (ERD + glossaire tables) | 4h | Onboarding & audits |
| 17 | Suite de tests minimale (guards auth, RLS, ownership) | 8h+ | Régression sécurité |

---

## Annexes

### Matrice de couverture auth — Server Actions

| Fichier | Guard | Verdict |
|---------|-------|---------|
| `auth.ts` | Public / rate-limit signIn | OK |
| `announcements.ts` | `requireActiveMembership` | OK |
| `events.ts` | `requireActiveMembership` | OK |
| `initiatives.ts` | `requireActiveMembership` | OK |
| `messages.ts` | `requireActiveMembership` | OK |
| `notifications.ts` | `requireActiveMembership` | OK |
| `profile.ts` | `requireAuth` | OK |
| `moderation.ts` | Staff/admin | OK |
| `platform-moderation.ts` | `requirePlatformAdmin` | OK |
| `reports.ts` | `requireActiveMembership` | OK |
| `municipality.ts` | **Mixte — 4 exports sans guard** | ⚠️ |
| `trial-invitation.ts` | Staff (IDOR communeId) | ⚠️ |
| `membership-role.ts` | `getSessionContext` + checks | OK |
| `cancellation.ts` | `requireCommuneStaff` + communeId | OK |
| `platform.ts` | `requirePlatformAdmin` | OK |
| `platform-settings.ts` | `requirePlatformAdmin` | OK |
| `legal-documents.ts` | `requirePlatformAdmin` | OK |
| `communication.ts` | `requirePlatformAdmin` | OK |
| `category-crud.ts` | `requirePlatformAdmin` | OK |
| `support-requests.ts` | `requireActiveMembership` | OK |
| `onboarding.ts` | `requireActiveMembership` | OK |

### Headers sécurité actifs (`next.config.ts`)

| Header | Valeur |
|--------|--------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |

### Tables RLS — couverture

Toutes les tables métier identifiées dans les 60 migrations ont `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Aucune table sans RLS trouvée.

### Fonctions SECURITY DEFINER (revue)

| Fonction | Migration | Évaluation |
|----------|-----------|------------|
| `is_platform_admin`, `has_active_membership` | `initial_schema` | OK — scoped `auth.uid()` |
| `handle_new_message` | `messaging` | OK — participants réels |
| `get_or_create_context_conversation` | `messaging` | OK — résout auteur serveur |
| `validate_trial_access_code` | `trial_code_rpc` | OK — exposée à anon (rate-limit volontairement non implémenté pour l'instant) |
| `list_my_conversations` | `moderation_system` | OK — filtre `auth.uid()` |
| `admin_commune_users` | `membership_roles` | OK — guard `is_platform_admin()` |
| `increment_membership_counter` | `guard_increment` | OK — ownership check |
| Triggers `enforce_*`, `protect_*` | Divers | OK — intégrité/sécurité |

---

*Rapport généré par audit statique. Aucun test dynamique (pentest, profiling runtime) n'a été réalisé.*
