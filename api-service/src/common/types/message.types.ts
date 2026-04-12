export type MessageStatus = 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'template' | 'media';
export type TemplateCategory = 'marketing' | 'utility' | 'authentication';

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  type: MessageType;
  templateCategory?: TemplateCategory;
  status: MessageStatus;
  attempts: number;
  failReason?: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export interface MessageStats {
  total: number;
  queued: number;
  processing: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}
