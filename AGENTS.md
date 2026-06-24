<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Stack locale (résumé)

- **App** : `npm run dev` → http://localhost:3000 (voir `package.json`).
- **Backend** : Supabase local via CLI (`npx supabase start`) — Postgres **54322**, API **54321**, Studio **54323**, Mailpit **54324**.
- **Docker** obligatoire pour Supabase local ; pas de `docker-compose` dans le dépôt.

### Premier démarrage sur une VM Cloud

1. **Docker** : le démon doit être accessible (`docker ps`). Sur cette image, si `permission denied` sur `/var/run/docker.sock`, exécuter une fois `sudo chmod 666 /var/run/docker.sock` (ou démarrer `dockerd` si absent : voir doc interne Cloud Agent pour `fuse-overlayfs`).
2. **Supabase** : `npx supabase start` à la racine (télécharge les images au premier lancement). Les migrations s’appliquent au démarrage ; le seed dev (`supabase/seed.sql`) est chargé selon la config CLI — en cas de base vide sans comptes, exécuter le seed manuellement (éviter `supabase db reset` sauf demande explicite de l’utilisateur).
3. **`.env.local`** (gitignored) : générer les clés avec `npx supabase status -o env`, puis renseigner au minimum :
   - `NEXT_PUBLIC_SUPABASE_URL` (= `API_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (= `ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (= `SERVICE_ROLE_KEY`)
   - `CRON_SECRET` (valeur arbitraire en local pour tester le cron)
   - **Web Push (VAPID)** — générer avec `npx web-push generate-vapid-keys` :
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (clé publique)
     - `VAPID_PRIVATE_KEY` (clé privée, serveur uniquement)
     - `VAPID_SUBJECT` (ex. `mailto:contact@tous-voisins.fr`)
4. **App** : `npm run dev`.

Comptes seed locaux (mot de passe **`VieLocaleDev2026!`**) : voir tableau dans `README.md` / `supabase/seed.sql` (ex. `dubois.gwendoline@hotmail.fr` → backoffice plateforme, commune pilote **Les Authieux**).

### Commandes utiles

| Action | Commande |
|--------|----------|
| Lint | `npm run lint` (peut signaler une règle React existante sur `ban-autocomplete.tsx`) |
| Build | `npm run build` |
| Tests automatisés | **Aucune suite** dans le dépôt pour l’instant |
| Migrations (lecture) | `npx supabase migration list --local` |
| SQL lecture seule | `npx supabase db query "..." --local` |

### Services à lancer manuellement (hors update script VM)

- `dockerd` si Docker n’est pas déjà actif.
- `npx supabase start` (après reboot VM ou arrêt des conteneurs).
- `npm run dev` (de préférence dans une session **tmux** pour les agents Cloud).

L’API **BAN** (`api-adresse.data.gouv.fr`) et les tuiles carte sont des dépendances HTTPS externes ; pas de service local supplémentaire pour l’auth ou les annonces de base.

### Notifications push (production)

Sur l’hébergeur (Vercel Dashboard, variables Docker, etc.) :

1. Générer une paire VAPID **dédiée à la prod** : `npx web-push generate-vapid-keys`
2. Configurer :
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (clé publique)
   - `VAPID_PRIVATE_KEY` (clé privée, jamais côté client)
   - `VAPID_SUBJECT=mailto:contact@tous-voisins.fr`
3. HTTPS obligatoire en prod ; `SUPABASE_SERVICE_ROLE_KEY` requise pour l’envoi.

Changer les clés VAPID invalide les abonnements existants — les utilisateurs devront réactiver.
