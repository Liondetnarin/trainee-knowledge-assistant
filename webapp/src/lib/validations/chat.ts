import { z } from "zod";

const optionalDocumentId = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().uuid().optional(),
);

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  documentId: optionalDocumentId,
  conversationId: z.string().uuid("Invalid conversation"),
});

export type ChatInput = z.infer<typeof chatSchema>;

export const createConversationSchema = z.object({
  title: z.string().trim().max(120).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
