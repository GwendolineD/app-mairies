# Vie Locale

PWA mobile-first pour créer du lien social dans les communes françaises.

**Baseline :** Découvrir · Partager · S'entraider

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Auth, Postgres, RLS, Storage, Realtime)
- API BAN ([api-adresse.data.gouv.fr](https://api-adresse.data.gouv.fr))
- Leaflet + react-leaflet + tuiles OpenStreetMap

## Démarrage

```bash
cd vie-locale
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Supabase

1. Créer un projet Supabase (région EU recommandée)
2. Appliquer la migration :

```bash
supabase db push
# ou exécuter supabase/migrations/20260522000000_initial_schema.sql dans le SQL Editor
```

3. Importer les communes françaises :

```bash
npm install -D tsx
npx tsx scripts/import-communes.ts
```

4. **Seed local (commune pilote + comptes dev)** — automatique sur `supabase db reset` :

| Compte | Email | Rôle | URL |
|--------|-------|------|-----|
| Vous (backoffice) | `dubois.gwendoline@hotmail.fr` | Super admin (`profiles.is_platform_admin`) | `/backoffice/admin` |
| Mairie pilote | `mairie.les-authieux@vie-locale.dev` | Staff commune (`memberships.role = 'staff'`) | `/mairie` |

Mot de passe seed local : **`VieLocaleDev2026!`** (voir [`supabase/seed.sql`](supabase/seed.sql))

Commune pilote : **Les Authieux** (INSEE `27027`, `27220`)

```bash
supabase db reset   # migration + seed
```

Sur un projet **cloud** distant : exécutez `supabase/seed.sql` dans le SQL Editor (dev uniquement).

5. Import national optionnel : `npm run import-communes` (communes en `inactive`, Les Authieux reste `active` via seed)

## Catégories d'annonces (11)

Bricolage, Numérique, Covoiturage, Alimentaire, Garde pontuelle, Administratif, Animaux, Jardinage, Prêt d'objet, Don / troc, **Autres**

Icônes et épingle carte : placeholders (`icon_url`, `map_pin_url` null) — à remplacer quand les assets seront fournis.

## Espaces

| Route | Rôle | Accès |
|-------|------|-------|
| `/` | Landing | Public |
| `/inscription`, `/connexion` | Auth + choix commune (BAN) | Public |
| `/accueil`, `/annonces`, `/initiatives`, `/evenements`, `/messages`, `/profil` | Habitant | Membership active |
| `/mairie/*` | Dashboard mairie | `memberships.role` staff/mayor **ou** super admin |
| `/backoffice/*` | Backoffice éditeur | Super admin (`profiles.is_platform_admin`) |
| `/suspendu` | Page réclamation (membership suspendue) | Membership suspendue |

## Cron (cycle de vie annonces)

Configurer Vercel Cron ou équivalent :

```
GET /api/cron/announcements-lifecycle
Authorization: Bearer $CRON_SECRET
```

- Nudge 30 jours (sans date)
- Alerte J-3 avant expiration
- Passage en `expiree` à J+7 après `target_date`

## Notifications push (Web Push)

Les notifications push utilisent le protocole **Web Push** (service worker `public/sw.js`, package `web-push`, table `push_subscriptions`).

### Local

1. Générer une paire de clés VAPID :

```bash
npx web-push generate-vapid-keys
```

2. Ajouter dans `.env.local` :

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<clé publique générée>
VAPID_PRIVATE_KEY=<clé privée générée>
VAPID_SUBJECT=mailto:contact@tous-voisins.fr
```

3. Redémarrer `npm run dev`, puis **Profil → Préférences de notification → Activer**.

`localhost` est un contexte sécurisé : push + service worker fonctionnent en HTTP. Pour tester sur mobile, exposer l’app via ngrok (déjà autorisé dans `next.config.ts`).

### Production

- Générer une **paire VAPID dédiée à la prod** (ne pas réutiliser les clés dev).
- Configurer sur l’hébergeur (Vercel, Docker, etc.) :
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT=mailto:contact@tous-voisins.fr`
- Le site doit être servi en **HTTPS** (obligatoire pour Web Push hors localhost).
- `SUPABASE_SERVICE_ROLE_KEY` doit être présente (lecture des abonnements push).

**Important :** changer les clés VAPID invalide tous les abonnements existants — les utilisateurs devront réactiver les push.

## Cursor rules

Dans `.cursor/rules/` : engineering, multi-tenant, design system, analytics, copy FR, destructive actions, ethical nudge UX.

## Assets à fournir

- Logo horizontal / vertical → `public/brand/`
- Icônes catégories → `announcement_categories.icon_url`
- Épingles carte → `announcement_categories.map_pin_url`
- Illustrations hero accueil → remplacer `AssetPlaceholder`
