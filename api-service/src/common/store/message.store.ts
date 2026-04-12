import { Injectable } from '@nestjs/common';
import { eq, desc, sql, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { messages } from '../database/schema';
import type {
  Message,
  MessageStats,
  MessageStatus,
  MessageType,
} from '../types/message.types';

@Injectable()
export class MessageStore {
  constructor(private readonly database: DatabaseService) {}

  async create(data: {
    sender: string;
    receiver: string;
    message: string;
    type: MessageType;
    templateCategory?: string;
  }): Promise<Message> {
    const id = crypto.randomUUID();
    
    const [row] = await this.database.db.insert(messages).values({
      id,
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      type: data.type,
      templateCategory: data.templateCategory,
      status: 'queued',
      attempts: 0,
    }).returning();

    return this.mapToMessage(row);
  }

  async updateStatus(
    id: string,
    status: MessageStatus,
    extra: Partial<Message> = {},
  ): Promise<Message | null> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (extra.sentAt !== undefined) updateData.sentAt = extra.sentAt ? new Date(extra.sentAt) : null;
    if (extra.deliveredAt !== undefined) updateData.deliveredAt = extra.deliveredAt ? new Date(extra.deliveredAt) : null;
    if (extra.readAt !== undefined) updateData.readAt = extra.readAt ? new Date(extra.readAt) : null;
    if (extra.failReason !== undefined) updateData.failReason = extra.failReason;
    if (extra.attempts !== undefined) updateData.attempts = extra.attempts;

    const [row] = await this.database.db
      .update(messages)
      .set(updateData)
      .where(eq(messages.id, id))
      .returning();

    return row ? this.mapToMessage(row) : null;
  }

  async get(id: string): Promise<Message | null> {
    const [row] = await this.database.db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    
    return row ? this.mapToMessage(row) : null;
  }

  async list(filters?: {
    receiver?: string;
    status?: MessageStatus;
    type?: MessageType;
    limit?: number;
  }): Promise<Message[]> {
    let query = this.database.db.select().from(messages);
    
    const conditions: any[] = [];
    if (filters?.receiver) conditions.push(eq(messages.receiver, filters.receiver));
    if (filters?.status) conditions.push(eq(messages.status, filters.status));
    if (filters?.type) conditions.push(eq(messages.type, filters.type));

    const finalQuery = (conditions.length > 0 
      ? query.where(and(...conditions)) 
      : query
    ).orderBy(desc(messages.createdAt)).limit(filters?.limit ?? 100);

    const rows = await finalQuery;
    return rows.map(this.mapToMessage);
  }

  async stats(): Promise<MessageStats> {
    const [res] = await this.database.db.select({
      total: sql<number>`count(*)`,
      queued: sql<number>`count(*) filter (where status = 'queued')`,
      processing: sql<number>`count(*) filter (where status = 'processing')`,
      sent: sql<number>`count(*) filter (where status = 'sent')`,
      delivered: sql<number>`count(*) filter (where status = 'delivered')`,
      read: sql<number>`count(*) filter (where status = 'read')`,
      failed: sql<number>`count(*) filter (where status = 'failed')`,
    }).from(messages);

    return {
      total: Number(res.total),
      queued: Number(res.queued),
      processing: Number(res.processing),
      sent: Number(res.sent),
      delivered: Number(res.delivered),
      read: Number(res.read),
      failed: Number(res.failed),
    };
  }

  private mapToMessage(row: any): Message {
    return {
      ...row,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      sentAt: row.sentAt?.toISOString(),
      deliveredAt: row.deliveredAt?.toISOString(),
      readAt: row.readAt?.toISOString(),
    };
  }
}
