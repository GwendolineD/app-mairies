import { z } from "zod";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";

const categorySlugs = ANNOUNCEMENT_CATEGORIES.map((c) => c.slug) as [
  string,
  ...string[],
];

export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  inseeCode: z.string().min(1),
  addressLabel: z.string().min(5, "Adresse requise"),
  addressCitycode: z.string().min(1),
  addressPostcode: z.string().min(4),
  addressLat: z.number(),
  addressLng: z.number(),
});

export const announcementSchema = z.object({
  type: z.enum(["demande", "offre"]),
  categorySlug: z.enum(categorySlugs),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const initiativeSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(3000).optional(),
  dateMode: z.enum(["none", "once", "recurring"]),
  singleStartsAt: z.string().optional(),
  singleEndsAt: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(3000).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const reportSchema = z.object({
  contextType: z.enum(["announcement", "initiative", "event"]),
  contextId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
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
