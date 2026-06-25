# Audit Sécurité, Performance & Maintenabilité — Tous Voisins

**Date :** 24 juin 2026  
**Stack :** Next.js 16.2.6 · React 19 · Supabase · Tailwind v4 · TypeScript strict  
**Scope :** ~469 fichiers source, 40 migrations SQL, 4 API routes, 21 server actions

---

## Table des matières

1. [Résumé exécutif](#résumé-exécutif)
2. [Problèmes à corriger — par urgence](#problèmes-à-corriger)
   - [P0 — Critique (à corriger immédiatement)](#p0--critique)
   - [P1 — Élevé (court terme)](#p1--élevé)
   - [P2 — Moyen (moyen terme)](#p2--moyen)
   - [P3 — Faible (amélioration continue)](#p3--faible)
3. [Points forts](#points-forts)

---

## Résumé exécutif

| Domaine | Évaluation | Commentaire |
|---------|:----------:|-------------|
| **Sécurité** | ⚠️ Critique | 2 failles RLS permettant une élévation de privilèges, route API non protégée |
| **Performance** | ⚠️ Moyen | Requêtes non bornées sur la carte, waterfalls évitables, session dupliquée |
| **Maintenabilité** | ⚠️ Moyen | Bonne architecture mais 12 fichiers `@ts-nocheck`, zéro tests, erreurs silencieuses |

---

## Problèmes à corriger

### P0 — Critique

> Failles exploitables ou risques de dégradation grave en production.

#### 1. 🔒 Élévation de privilèges via RLS `profiles_update`

**Fichier :** `supabase/migrations/20260522000000_initial_schema.sql` (l.719–721)

Un utilisateur authentifié peut modifier **toutes les colonnes** de son profil, y compris `is_platform_admin = true` (accès backoffice complet) ou `banned_at = NULL` (contournement d'un ban). L'exploit est un simple UPDATE via l'API REST Supabase avec la clé anon + JWT.

**Correction :** Trigger `BEFORE UPDATE` ou policy `WITH CHECK` bloquant `is_platform_admin`, `banned_at`, `banned_by`.

---

#### 2. 🔒 Élévation de privilèges via RLS `memberships_update`

**Fichier :** `supabase/migrations/20260522000000_initial_schema.sql` (l.734–739)

Un membre ordinaire peut modifier sa propre adhésion : `role = 'mayor'` ou `'staff'`, `status = 'active'`, `suspended_at = NULL`. Même vecteur que ci-dessus.

**Correction :** Séparer self-update (adresse uniquement) et staff-update (role/status), ou trigger bloquant.

---

#### 3. 🔒 Route `/api/analytics` non authentifiée + `service_role`

**Fichier :** `app/api/analytics/route.ts` (l.5–27)

Aucune vérification d'identité, insertion via `service_role` (bypass RLS), `communeId` fourni par le client sans validation. Permet pollution illimitée de la table analytics.

**Correction :** Exiger auth, utiliser le client utilisateur, valider `communeId` contre les memberships.

---

#### 4. ⚡ Requêtes carte sans borne — risque de timeout/OOM

**Fichiers :** `lib/queries/announcements.ts` (l.194–209), `lib/queries/initiatives.ts` (l.178–195), `lib/queries/events.ts` (l.67–83)

`listAnnouncementMapItems`, `listInitiativeMapItems`, `listEventMapItems` chargent **toutes** les entrées géolocalisées d'une commune sans `.limit()`. Avec la croissance des données, ces requêtes deviendront les premières à timeout.

**Correction :** Paginer côté RPC avec clustering géographique, ou imposer un `.limit(500)` minimum.

---

#### 5. ⚡ `countUnreadMessages` via inbox complète

**Fichier :** `lib/queries/messages.ts` (l.62–74)

Appelle `list_my_conversations` (toutes les conversations) puis somme en JS. La RPC `get_unread_message_count` existe déjà en DB mais n'est jamais utilisée.

**Correction :** Utiliser la RPC dédiée `get_unread_message_count`.

---

#### 6. ⚡ Session auth dupliquée layout + page (×2 par navigation)

**Fichiers :** `app/(resident)/layout.tsx` (l.22) + chaque page enfant

`requireActiveMembership()` est appelé dans le layout ET dans chaque page, sans `React.cache()`. Chaque navigation résident = 2× `getUser()` + 2× profile + 2× memberships.

**Correction :** Wrapper `getSessionContext` avec `React.cache()`.

---

### P1 — Élevé

> Problèmes de sécurité ou performance significatifs, à traiter rapidement.

#### 7. 🔒 Fuite des codes d'accès trial via SELECT public

**Fichier :** `supabase/migrations/20260618400000_trial_access_code.sql`

La policy `communes_select_public` expose `trial_access_code` à tout client (anon ou authentifié), rendant le rate limit applicatif contournable.

**Correction :** Vue sans colonnes sensibles, ou colonne exclue du SELECT anon.

---

#### 8. 🔒 XSS via documents légaux (`dangerouslySetInnerHTML`)

**Fichier :** `app/(public)/legal/[slug]/page.tsx` (l.52)

HTML éditable par admin (TipTap) injecté sans sanitization. Un admin compromis pourrait injecter du JS.

**Correction :** DOMPurify côté serveur à la sauvegarde et/ou à l'affichage.

---

#### 9. 🔒 Absence de security headers

**Fichier :** `next.config.ts`

Aucun en-tête HTTP de sécurité configuré : pas de CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

**Correction :** Ajouter un bloc `headers()` dans `next.config.ts`.

---

#### 10. 🔒 Open redirect partiel dans auth callback

**Fichier :** `app/auth/callback/route.ts` (l.39–57)

Le paramètre `next` n'est pas validé (pas de whitelist ni regex restrictive).

**Correction :** Regex `^/[a-zA-Z0-9/_-]*$` ou whitelist de chemins.

---

#### 11. 🔒 Pas de validation Zod sur `signIn`

**Fichier :** `lib/actions/auth.ts` (l.197–210)

Email et mot de passe extraits de FormData sans validation, envoyés directement à Supabase.

**Correction :** Passer par un schéma Zod minimal.

---

#### 12. ⚡ Waterfalls séquentiels sur pages détail

**Fichiers :** `app/(resident)/evenements/[id]/page.tsx`, `initiatives/[id]/page.tsx`, `mairie/signalements/page.tsx`

Requêtes séquentielles (event → auteur → initiative → volunteers → participants) alors qu'elles sont indépendantes et parallélisables via `Promise.all`.

**Correction :** Regrouper les fetches indépendants dans un `Promise.all`.

---

#### 13. ⚡ Index DB manquants sur requêtes fréquentes

**Tables concernées :** `reports(commune_id, created_at)`, `event_volunteers(event_id)`, `event_participants(event_id)`, `initiative_responses(initiative_id, response_type)`, `events(commune_id, ends_at)`

**Correction :** Migration ajoutant les index composites.

---

#### 14. ⚡ Communes plateforme et signalements mairie sans pagination

**Fichiers :** `app/(platform)/platform/communes/page.tsx` (l.10–13), `app/(municipality)/mairie/signalements/page.tsx` (l.64–72)

`select("*").order("name")` sur toutes les communes, tous les signalements sans limite.

**Correction :** Pagination ou `.limit()`.

---

#### 15. 🛠️ 12 fichiers `@ts-nocheck` — perte du typage sur du code critique

**Fichiers :** `lib/queries/announcements.ts`, `lib/queries/initiatives.ts`, `lib/actions/announcements.ts`, `lib/actions/announcement-categories.ts`, `lib/push/send.ts`, `lib/utils/names.ts`, `lib/utils/lucide-icon-map.ts`, `lib/utils/conversation.ts`, `components/ui/avatar.tsx`, `components/features/backoffice/categories-grid.tsx`, `components/features/initiatives-page-client.tsx`, `components/features/evenements-page-client.tsx`

Le compilateur est aveugle sur les zones les plus critiques (queries, actions, push).

**Correction :** Générer les types Supabase (`Database`) et résoudre les erreurs progressivement.

---

#### 16. 🛠️ Types Supabase non générés — dérive schema/code

Aucun `database.types.ts`, aucune référence au type `Database`. Les clients Supabase ne sont pas typés. Les types domaine sont maintenus manuellement dans `lib/types/index.ts`.

**Correction :** `supabase gen types typescript --local` + brancher sur les clients.

---

#### 17. 🛠️ Aucun test automatisé, aucune CI

Zéro fichier test, pas de Jest/Vitest/Playwright, pas de pipeline GitHub Actions. Régression impossible à détecter.

**Correction :** Suite Vitest minimale sur `lib/utils/*`, `lib/validations/schemas.ts`, helpers auth.

---

### P2 — Moyen

> Améliorations importantes pour la qualité à moyen terme.

| # | Domaine | Problème | Fichier(s) clé(s) |
|---|---------|----------|-------------------|
| 18 | 🔒 | RPC `increment_membership_counter` sans garde — tout authentifié peut l'appeler | Migration `20260618200000` |
| 19 | 🔒 | Rate limit trial en mémoire — inefficace en serverless | `lib/utils/trial-rate-limit.ts` |
| 20 | 🔒 | Inscription sans confirmation email (`enable_confirmations = false`) | `supabase/config.toml` l.228 |
| 21 | ⚡ | Dashboard mairie : scan complet `created_at` puis agrégation JS | `lib/queries/dashboard-charts.ts` |
| 22 | ⚡ | `<img>` raw pour photos Cloudinary (~20 composants) — pas d'optim Next.js | `announcement-card.tsx`, `event-card.tsx`, etc. |
| 23 | ⚡ | TipTap et Recharts non lazy-loadés dans le backoffice | `legal-document-editor.tsx`, `dashboard-*-chart.tsx` |
| 24 | 🛠️ | Retours d'actions incohérents : void vs `{ error }` vs throw | `lib/actions/reports.ts`, `events.ts`, `municipality.ts` |
| 25 | 🛠️ | Erreurs Supabase ignorées dans les pages RSC (UI vide au lieu d'erreur) | Toutes les pages `(resident)` |
| 26 | 🛠️ | Aucun `error.tsx` / `global-error.tsx` / Error Boundary | `app/` |
| 27 | 🛠️ | Actions catégories dupliquées (~200 lignes quasi identiques) | `lib/actions/announcement-categories.ts` vs `initiative-event-categories.ts` |
| 28 | 🛠️ | `.catch(() => {})` — emails signalement avalés sans log | `lib/actions/reports.ts` l.162, 188 |

---

### P3 — Faible

> Nettoyage, cohérence, bonnes pratiques mineures.

| # | Domaine | Problème | Fichier(s) |
|---|---------|----------|------------|
| 29 | 🔒 | `allowedOrigins` ngrok dans `next.config.ts` — à retirer en prod | `next.config.ts` |
| 30 | ⚡ | `ban-autocomplete.tsx` : pas de cleanup `useEffect` au unmount | `components/features/ban-autocomplete.tsx` |
| 31 | ⚡ | `listAnnouncementMarkers` définie mais jamais importée (code mort) | `lib/queries/announcements.ts` l.172 |
| 32 | ⚡ | `accueil-sections.tsx` : `'use client'` entier pour un hook créant un boundary inutile | `components/features/accueil-sections.tsx` |
| 33 | 🛠️ | `use-sync-external-store` en dependency directe — probablement inutilisé | `package.json` |
| 34 | 🛠️ | README référence `vie-locale` alors que le package s'appelle `tous-voisins` | `README.md` |
| 35 | 🛠️ | `CONTEXT_TYPE_LABELS` dupliqué entre `lib/actions/reports.ts` et page backoffice | 2 fichiers |
| 36 | 🛠️ | Double chemin d'import `cn()` : `@/lib/utils` (~30 fichiers) vs `@/lib/utils/cn` (~80 fichiers) | `lib/utils.ts` + `lib/utils/cn.ts` |
| 37 | 🛠️ | Variables env référencées mais absentes de `.env.example` : `SMTP_*`, `ADMIN_NOTIFICATION_EMAIL` | `.env.example` |

---

## Points forts

L'application présente une base solide sur de nombreux axes :

### Architecture & Organisation

- **Séparation claire par rôle** : route groups `(resident)`, `(municipality)`, `(backoffice)`, `(platform)` avec layouts dédiés et guards spécifiques.
- **Server Components par défaut** : bonne adoption du pattern Next.js 16 App Router, `'use client'` réservé aux interactions.
- **Couches bien identifiées** : `lib/actions/` (mutations), `lib/queries/` (lectures), `lib/auth/` (guards), `lib/validations/` (Zod), `lib/constants/` (pas de magic strings).
- **Multi-tenant rigoureux** : `commune_id` imposé côté app sur toutes les créations, guards staff/admin centralisés.

### Sécurité (positif)

- **RLS activé sur toutes les tables** — aucune table métier sans protection.
- **`service_role` strictement serveur** — pas d'import browser détecté.
- **Cron protégé** par secret Bearer.
- **Uploads sécurisés** : validation MIME + taille + scan antivirus ClamAV (fail-closed).
- **Password recovery** : cookie httpOnly requis, flow bien conçu.
- **Validation Zod extensive** sur les mutations métier principales.

### Performance (positif)

- **Pagination systématique** sur les listes (20 items/page).
- **Batch queries** : `enrichInitiativesWithMeta` utilise `.in()` — pas de N+1.
- **Jointures Supabase** : auteur embarqué en 1 requête dans les listes.
- **`dynamic({ ssr: false })`** sur les composants carte (Leaflet).
- **`unstable_cache`** sur données quasi-statiques (catégories, documents légaux).
- **Suspense + streaming** sur les messages.
- **`Promise.all`** sur l'accueil (fetches parallèles).

### Maintenabilité (positif)

- **TypeScript strict activé**, aucun `any` explicite dans le code.
- **Zod centralisé** (`lib/validations/schemas.ts`) — source unique de vérité validation.
- **Pas de magic strings** : routes, rôles, statuts, catégories tous centralisés dans `lib/constants/`.
- **Design system cohérent** : composants shadcn/ui bien documentés, tokens CSS centralisés.
- **Règles projet** (`.cursor/rules/*.mdc`) : architecture, design system, multi-tenant, data — excellente documentation interne.
- **Pas de TODO/FIXME** accumulés dans le code.

### DevX & Déploiement

- **Dockerfile multi-stage** optimisé (output standalone, user non-root).
- **PWA ready** : manifest, service worker, icons.
- **Seed dev complet** avec comptes de test documentés.
- **Scripts utilitaires** : bootstrap admin, import communes, génération icônes PWA.

---

## Métriques clés

| Indicateur | Valeur |
|------------|--------|
| Fichiers source | ~469 |
| Migrations SQL | 40 |
| Server Actions | 21 fichiers |
| Composants UI (shadcn) | 41 |
| Composants features | 138 |
| `'use client'` | ~130 fichiers |
| Tests automatisés | 0 |
| Fichiers `@ts-nocheck` | 12 |
| Findings critiques (P0) | 6 |
| Findings élevés (P1) | 11 |

---

*Rapport généré automatiquement — audit en lecture seule, aucune modification du code.*
