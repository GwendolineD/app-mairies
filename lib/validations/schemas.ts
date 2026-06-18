import { z } from "zod";
import { ANNOUNCEMENT_CATEGORY_SLUGS } from "@/lib/constants/announcement-categories";
import { ANNOUNCEMENT_TYPE_SLUGS } from "@/lib/constants/announcement-types";

export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum")
  .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Lettres et chiffres requis");

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: passwordSchema,
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  inseeCode: z.string().min(1),
  trialAccessCode: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  addressStreet: z.string().min(1, "Rue requise"),
  addressLieuDit: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  addressCity: z.string().min(1, "Ville requise"),
  addressCitycode: z.string().min(1),
  addressPostcode: z.string().min(4),
  addressLat: z.number(),
  addressLng: z.number(),
  acceptedTerms: z.literal("true", {
    message: "Acceptation des conditions requise",
  }),
});

export const joinCommuneSchema = z.object({
  inseeCode: z.string().min(1),
  trialAccessCode: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  addressCity: z.string().min(1, "Ville requise"),
  addressCitycode: z.string().min(1),
  addressPostcode: z.string().min(4),
  addressLat: z.number(),
  addressLng: z.number(),
});

export const announcementSchema = z.object({
  type: z.enum(ANNOUNCEMENT_TYPE_SLUGS),
  categorySlug: z.enum(ANNOUNCEMENT_CATEGORY_SLUGS),
  title: z.string().trim().min(1, "Titre requis").max(70, "Titre trop long (70 caractères max.)"),
  description: z
    .string()
    .max(1000, "Description trop longue (1000 caractères max.)")
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Description requise")
        .max(1000, "Description trop longue (1000 caractères max.)"),
    ),
  targetDate: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v : undefined)),
  photoUrl: z.string().url().optional().or(z.literal("")),
  addressStreet: z.string().trim().min(1, "Rue requise"),
  addressCity: z.string().trim().min(1, "Ville requise"),
  addressCitycode: z.string().trim().min(1, "Commune invalide"),
  addressPostcode: z.string().trim().min(4, "Code postal invalide"),
  addressLat: z
    .number({ error: "Localisation invalide : sélectionnez une adresse dans la liste." })
    .finite("Localisation invalide : sélectionnez une adresse dans la liste."),
  addressLng: z
    .number({ error: "Localisation invalide : sélectionnez une adresse dans la liste." })
    .finite("Localisation invalide : sélectionnez une adresse dans la liste."),
});

import { INITIATIVE_CATEGORY_SLUGS } from "@/lib/constants/initiative-categories";

export const initiativeSchema = z.object({
  categorySlug: z.enum(INITIATIVE_CATEGORY_SLUGS),
  title: z.string().min(3).max(70),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  addressStreet: z.string().max(500).optional(),
  addressCity: z.string().max(200).optional(),
  addressPostcode: z.string().max(10).optional(),
  addressCitycode: z.string().max(10).optional(),
  addressLat: z.coerce.number().optional(),
  addressLng: z.coerce.number().optional(),
});

export const createEventFromInitiativeSchema = z.object({
  initiativeId: z.string().uuid(),
  startsAt: z.string().min(1, "Date de début requise"),
  endsAt: z.string().min(1, "Date de fin requise"),
  volunteersNeeded: z.coerce.number().int().min(0).optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(3000).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  addressLabel: z.string().max(500).optional(),
  addressLat: z.number().optional(),
  addressLng: z.number().optional(),
});

export const eventModalSchema = z.object({
  categorySlug: z.enum(INITIATIVE_CATEGORY_SLUGS),
  title: z.string().trim().min(3, "Titre requis (3 caractères min.)").max(120, "Titre trop long (120 caractères max.)"),
  description: z
    .string()
    .max(3000, "Description trop longue (3000 caractères max.)")
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Description requise")
        .max(3000, "Description trop longue (3000 caractères max.)"),
    ),
  photoUrl: z.string().url().optional().or(z.literal("")),
  startsAt: z.string().min(1, "Date et heure de début requises"),
  endsAt: z.string().min(1, "Date et heure de fin requises"),
  volunteersNeeded: z.coerce.number().int().min(0).nullable().optional(),
  addressStreet: z.string().max(500).optional(),
  addressCity: z.string().max(200).optional(),
  addressPostcode: z.string().max(10).optional(),
  addressCitycode: z.string().max(10).optional(),
  addressLat: z.coerce.number().optional(),
  addressLng: z.coerce.number().optional(),
  sourceInitiativeId: z.string().uuid().optional(),
});

export const userReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  addressStreet: z.string().trim().min(1, "Rue requise"),
  addressCity: z.string().trim().min(1, "Ville requise"),
  addressPostcode: z.string().trim().min(4, "Code postal invalide"),
  addressLat: z
    .number({ error: "Localisation invalide : sélectionnez une adresse dans la liste." })
    .finite("Localisation invalide : sélectionnez une adresse dans la liste."),
  addressLng: z
    .number({ error: "Localisation invalide : sélectionnez une adresse dans la liste." })
    .finite("Localisation invalide : sélectionnez une adresse dans la liste."),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const notificationPreferencesSchema = z.object({
  notify_message_announcement: z.boolean(),
  notify_message_initiative: z.boolean(),
  notify_message_event: z.boolean(),
  notify_new_announcement: z.boolean(),
  notify_new_initiative: z.boolean(),
  notify_new_event: z.boolean(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(500).optional(),
});

export const reportSchema = z.object({
  contextType: z.enum(["announcement", "initiative", "event"]),
  contextId: z.string().uuid(),
  reason: z.string().min(10).max(400),
});

export const appealSchema = z.object({
  message: z.string().min(10).max(2000),
});

export const communeSettingsSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  referentName: z.string().optional(),
  referentRole: z.string().optional(),
  openingHours: z.string().optional(),
  welcomeMessage: z.string().optional(),
});

export const createPilotCommuneSchema = z.object({
  inseeCode: z.string().min(1, "Code INSEE requis"),
  name: z.string().min(1, "Nom requis"),
  postcode: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  centroidLat: z.number(),
  centroidLng: z.number(),
  accessStatus: z.enum(["inactive", "trial", "active"]),
  mairieAddress: z.string().trim().min(3, "Adresse mairie requise"),
});
