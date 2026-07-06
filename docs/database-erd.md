# Database ERD — Tous Voisins

Diagramme de référence du schéma Postgres (Supabase). Les policies RLS ne sont pas représentées ici.

```mermaid
erDiagram
  profiles ||--o{ memberships : has
  communes ||--o{ memberships : scopes
  communes ||--o{ announcements : scopes
  communes ||--o{ initiatives : scopes
  communes ||--o{ events : scopes
  communes ||--o{ reports : scopes
  communes ||--o{ conversations : scopes

  memberships ||--o{ announcements : authors
  memberships ||--o{ initiatives : authors
  memberships ||--o{ events : authors

  profiles ||--o{ conversation_participants : joins
  conversations ||--o{ conversation_participants : has
  conversations ||--o{ messages : contains

  profiles ||--o{ notifications : receives
  profiles ||--o| user_notification_preferences : configures
  profiles ||--o{ push_subscriptions : registers

  communes ||--o| commune_subscriptions : bills
  communes ||--o{ subscription_cancellations : may_cancel

  profiles {
    uuid user_id PK
    text first_name
    text last_name
    text display_name
    text avatar_url
    uuid active_commune_id FK
    boolean is_platform_admin
    timestamptz banned_at
  }

  communes {
    uuid id PK
    text insee_code UK
    text name
    text access_status
    text trial_access_code
    jsonb settings
  }

  memberships {
    uuid id PK
    uuid user_id FK
    uuid commune_id FK
    text role
    text status
    text address_street
    float address_lat
    float address_lng
  }

  announcements {
    uuid id PK
    uuid commune_id FK
    uuid author_membership_id FK
    text type
    text category_slug
    text title
    date target_date
    float address_lat
    float address_lng
    timestamptz suspended_at
  }

  initiatives {
    uuid id PK
    uuid commune_id FK
    uuid author_membership_id FK
    text category_slug
    text title
    float address_lat
    float address_lng
  }

  events {
    uuid id PK
    uuid commune_id FK
    uuid author_membership_id FK
    timestamptz starts_at
    timestamptz ends_at
    uuid source_initiative_id FK
    boolean is_official
  }

  conversations {
    uuid id PK
    uuid commune_id FK
    uuid participant_a FK
    uuid participant_b FK
    text context_type
    uuid context_id
  }

  messages {
    uuid id PK
    uuid conversation_id FK
    uuid sender_id FK
    text body
    timestamptz created_at
  }

  reports {
    uuid id PK
    uuid commune_id FK
    uuid reporter_user_id FK
    text context_type
    uuid context_id
    text status
    text resolution
  }

  notifications {
    uuid id PK
    uuid user_id FK
    uuid commune_id FK
    text type
    jsonb payload
    timestamptz read_at
  }

  platform_settings {
    int id PK
    text support_email
    jsonb error_illustration_urls
  }

  commune_interest_leads {
    uuid id PK
    uuid commune_id FK
    text insee_code
    text email
    jsonb metadata
  }
```

## Glossaire rapide

| Table | Rôle |
| --- | --- |
| `profiles` | Extension du compte Supabase Auth (profil, commune active, flags admin) |
| `communes` | Tenant — une commune adhérente ou en essai |
| `memberships` | Lien user ↔ commune avec rôle (`member`, `staff`, `mayor`) et adresse |
| `announcements` | Annonces voisins (demande / offre / don) |
| `initiatives` | Projets collectifs |
| `events` | Événements communaux (optionnellement liés à une initiative) |
| `conversations` / `messages` | Messagerie contextuelle (annonce, initiative, événement) |
| `reports` | Signalements modération |
| `notifications` | Notifications in-app (insert via triggers, pas de policy INSERT client) |
| `platform_settings` | Réglages globaux plateforme (email support, illustrations erreur) |
| `commune_interest_leads` | Leads pré-inscription (commune non disponible) |
