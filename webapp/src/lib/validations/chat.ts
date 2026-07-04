import { z } from "zod";

const optionalDocumentId = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().uuid().optional(),
);

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  documentId: optionalDocumentId,
});

export type ChatInput = z.infer<typeof chatSchema>;
