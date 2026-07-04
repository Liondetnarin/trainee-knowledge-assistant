import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  documentId: z.string().uuid().optional().nullable(),
});

export type ChatInput = z.infer<typeof chatSchema>;
