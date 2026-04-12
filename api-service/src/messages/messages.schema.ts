import { z } from 'zod';

export const SendMessageSchema = z.object({
  sender: z.string().min(1),
  receiver: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['text', 'template', 'media']).optional().default('text'),
  templateCategory: z.enum(['marketing', 'utility', 'authentication']).optional(),
});

export type SendMessageData = z.infer<typeof SendMessageSchema>;

export const ListMessagesSchema = z.object({
  receiver: z.string().optional(),
  status: z.enum(['queued', 'processing', 'sent', 'delivered', 'read', 'failed']).optional(),
  type: z.enum(['text', 'template', 'media']).optional(),
  limit: z.coerce.number().optional().default(100),
});

export type ListMessagesQuery = z.infer<typeof ListMessagesSchema>;

export const WebhookStatusSchema = z.object({
  messageId: z.string(),
  status: z.enum(['queued', 'processing', 'sent', 'delivered', 'read', 'failed']),
  timestamp: z.string().optional(),
  errorReason: z.string().optional(),
});
