import { z } from "zod";

export const businessNiches = ["food", "crafts", "fashion", "services", "other"] as const;
export const businessTones = ["friendly", "professional", "urgent", "casual"] as const;
export const businessLanguages = ["roman_ur", "ur", "en"] as const;
export const businessPlatforms = ["whatsapp", "instagram", "facebook", "tiktok", "daraz"] as const;

/** F-004 business profile update. */
export const updateBusinessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(120, "Business name is too long"),
  niche: z.enum(businessNiches, { message: "Choose a business niche" }),
  city: z.string().trim().min(1, "City is required").max(80, "City is too long"),
  area: z.string().trim().max(120, "Area is too long").optional(),
  budget_pkr: z
    .number({ message: "Budget must be a number" })
    .min(0, "Budget cannot be negative")
    .max(10_000_000, "Budget cannot exceed 10,000,000")
    .optional(),
  hours_per_week: z
    .number({ message: "Hours must be a number" })
    .min(0, "Hours cannot be negative")
    .max(168, "Hours per week cannot exceed 168")
    .optional(),
  tone: z.enum(businessTones, { message: "Choose a tone" }).optional(),
  languages: z.array(z.enum(businessLanguages)).min(1, "Select at least one language"),
  platforms: z.array(z.enum(businessPlatforms)).optional(),
  target_customer: z.string().trim().max(500, "Target customer is too long").optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
