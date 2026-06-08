import { z } from "zod";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import { ANNOUNCEMENT_TYPE_SLUGS } from "@/lib/constants/announcement-types";

const categorySlugs = ANNOUNCEMENT_CATEGORIES.map((c) => c.slug) as [
  string,
  ...string[],
];

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
  addressLabel: z.string().min(5, "Adresse requise"),
  addressCitycode: z.string().min(1),
  addressPostcode: z.string().min(4),
  addressLat: z.number(),
  addressLng: z.number(),
  acceptedTerms: z.literal("true", {
    message: "Acceptation des conditions requise",
  }),
});

export const announcementSchema = z.object({
  type: z.enum(ANNOUNCEMENT_TYPE_SLUGS),
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

export const suspendMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const communeSettingsSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  referentName: z.string().optional(),
  referentRole: z.string().optional(),
  openingHours: z.string().optional(),
  welcomeMessage: z.string().optional(),
});
