# Configuration Cron Jobs (cron-job.org)

## Jobs à configurer

### 1. Lifecycle Collector (quotidien)
- **URL** : `https://<domain>/api/cron/lifecycle`
- **Méthode** : GET
- **Header** : `Authorization: Bearer <CRON_SECRET>`
- **Schedule** : tous les jours à 06:00 (Europe/Paris)
- **Timeout** : 30s

**Rôle** : détecte les contenus éligibles aux relances, insère les emails dans la queue, envoie les notifications push et in-app, et applique la rétention : purge des annonces/conversations archivées depuis plus de 30 jours, et des notifications in-app lues depuis plus de 60 jours ou non lues depuis plus de 180 jours (durées centralisées dans `lib/constants/retention.ts`).

### 2. Email Sender (toutes les 2 minutes)
- **URL** : `https://<domain>/api/cron/email-sender`
- **Méthode** : GET
- **Header** : `Authorization: Bearer <CRON_SECRET>`
- **Schedule** : `*/2 * * * *`
- **Timeout** : 60s

**Rôle** : traite la queue d'emails par batch (FIFO), avec un délai inter-envoi pour protéger la réputation SMTP.

---

## Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `CRON_SECRET` | Token d'authentification des endpoints cron | (générer un UUID ou string aléatoire) |
| `CRON_EMAIL_BATCH_SIZE` | Nombre d'emails par exécution du sender | `10` |
| `CRON_EMAIL_DELAY_MS` | Délai entre chaque envoi (ms) | `500` |

---

## Notes d'exploitation

- Le lifecycle collector peut tourner entre 04:00 et 06:00 UTC (avant le réveil des users en France métropolitaine).
- L'email sender doit tourner fréquemment (2-5 min) pour un délai de livraison acceptable.
- En cas de maintenance : désactiver l'email-sender **en premier**, le collector **en second**.
- Les emails non envoyés restent en status `pending` dans `email_queue` — ils seront traités au prochain cycle.
- Le sender re-vérifie la préférence `email_lifecycle_enabled` avant chaque envoi (protection contre les désinscriptions entre collecte et envoi).
- La purge des notifications est bornée à 500 lignes par catégorie (lues / non lues) et par exécution ; un retard se résorbe sur quelques jours sans intervention.
- Les notifications liées à un contenu supprimé sont effacées par trigger SQL au moment de la suppression — la purge ne gère que l'ancienneté.

---

## Architecture

```
Cron Collector (1x/jour)          Cron Sender (*/2 min)
     │                                   │
     ├─ Purge archivées 30j              ├─ SELECT pending LIMIT batch
     ├─ Purge notifications 60j/180j     ├─ sendTemplatedEmail()
     ├─ Relances invitations             ├─ UPDATE sent/failed
     ├─ Engagement nouveaux inscrits     └─ sleep(delay_ms) entre chaque
     ├─ Annonces expirées
     ├─ Annonces stale 60j
     ├─ Initiatives stale 60j
     ├─ Events terminés +2j
     └─ Rappel notifications

       ↓ INSERT email_queue
       ↓ INSERT notifications (in-app, scopées commune) + Web Push
```

---

## Surveillance

Chaque endpoint retourne un JSON de résultat :

**Collector** :
```json
{
  "ok": true,
  "purgedAnnouncements": 0,
  "purgedConversations": 0,
  "purgedNotifications": 12,
  "queued": {
    "invites": 2,
    "engagement": 1,
    "announcementExpired": 0,
    "announcementStale": 3,
    "initiativeStale": 1,
    "eventPast": 0,
    "notificationReminder": 4
  },
  "at": "2026-07-09T04:00:01.234Z"
}
```

**Sender** :
```json
{
  "ok": true,
  "sent": 8,
  "failed": 0,
  "cancelled": 1,
  "at": "2026-07-09T04:02:01.567Z"
}
```

Configurer les alertes cron-job.org sur status code ≠ 200 ou body contenant `"error"`.
