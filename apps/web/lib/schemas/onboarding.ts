import { z } from "zod";

/** F-003 onboarding chat message sent to the Intake agent. */
export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
