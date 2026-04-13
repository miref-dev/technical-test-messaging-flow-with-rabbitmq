export interface Message {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  status: 'queued' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed';
  attempts: number;
  failReason?: string | null;
  createdAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
}