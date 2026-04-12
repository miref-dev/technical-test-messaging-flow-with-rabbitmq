import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageStore } from '../common/store/message.store';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { SendMessageData, ListMessagesQuery } from './messages.schema';
import type { Message, MessageStatus } from '../common/types/message.types';

@Injectable()
export class MessagesService implements OnModuleInit {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly store: MessageStore,
    private readonly rabbit: RabbitMQService,
    private readonly events: EventEmitter2,
  ) { }

  onModuleInit() {
    this.rabbit.setMessagesService(this);
  }

  /**
   * Send a single message
   */
  async send(data: SendMessageData): Promise<Message> {
    const msg = await this.store.create({
      receiver: data.receiver,
      sender: data.sender,
      message: data.message,
      type: data.type || 'text',
      templateCategory: data.templateCategory,
    });

    this.logger.log(`Queued message id=${msg.id} to=${msg.receiver}`);

    await this.rabbit.publishMessage(msg.id);

    this.events.emit('message.created', msg);
    this.events.emit('stats.update', await this.store.stats());

    return msg;
  }

  async list(query: ListMessagesQuery): Promise<Message[]> {
    return this.store.list({
      receiver: query.receiver,
      status: query.status,
      type: query.type,
      limit: query.limit,
    });
  }

  async findOne(id: string): Promise<Message> {
    const msg = await this.store.get(id);
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  /**
   * Mark a delivered message as read
   */
  async markRead(id: string): Promise<Message> {
    const msg = (await this.store.updateStatus(id, 'read', {
      readAt: new Date().toISOString(),
    }))!;

    this.events.emit('message.status', msg);
    this.events.emit('stats.update', await this.store.stats());
    return msg;
  }

  /**
   * Apply a status update (called by MQ consumer or Webhook)
   */
  async applyWebhookUpdate(
    messageId: string,
    status: MessageStatus,
    extra: Partial<Message> = {},
  ): Promise<Message | null> {
    const msg = await this.store.updateStatus(messageId, status, extra);
    if (msg) {
      this.events.emit('message.status', msg);
      this.events.emit('stats.update', await this.store.stats());
    }
    return msg;
  }

  async stats() {
    return this.store.stats();
  }

  /**
   * Resend a failed or existing message
   */
  async resend(id: string): Promise<Message> {
    const existing = await this.findOne(id);

    const msg = (await this.store.updateStatus(id, 'queued', {
      attempts: (existing.attempts ?? 0) + 1,
      failReason: null,
    }))!;

    this.logger.log(`Resending message id=${msg.id} to=${msg.receiver} (Attempt ${msg.attempts})`);

    await this.rabbit.publishMessage(msg.id);

    this.events.emit('message.status', msg);
    this.events.emit('stats.update', await this.store.stats());

    return msg;
  }
}
