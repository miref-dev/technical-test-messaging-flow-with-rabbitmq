import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export const EXCHANGE = 'messages.exchange';
export const QUEUES = {
  pending: 'messages.pending',
  status: 'messages.status',
  dlq: 'messages.dlq',
} as const;

/**
 * Thin wrapper around amqp-connection-manager.
 * Handles both publishing outgoing jobs and consuming incoming status updates.
 */
@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection!: amqp.AmqpConnectionManager;
  private channel!: ChannelWrapper;
  private messagesService!: any;

  setMessagesService(service: any) {
    this.messagesService = service;
  }

  async connect(): Promise<void> {
    const url = process.env.RABBITMQ_URL ?? 'amqp://localhost';

    this.connection = amqp.connect([url]);

    this.connection.on('connect', () =>
      this.logger.log('Connected to RabbitMQ'),
    );
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`Disconnected from RabbitMQ: ${err?.message}`),
    );

    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange('messages.dlx', 'direct', { durable: true });
        await ch.assertQueue(QUEUES.dlq, { durable: true });
        await ch.bindQueue(QUEUES.dlq, 'messages.dlx', 'pending');

        await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
        await ch.assertQueue(QUEUES.pending, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'messages.dlx',
            'x-dead-letter-routing-key': 'pending',
            'x-message-ttl': 60_000,
          },
        });
        await ch.bindQueue(QUEUES.pending, EXCHANGE, 'pending');

        await ch.assertQueue(QUEUES.status, { durable: true });
        await ch.bindQueue(QUEUES.status, EXCHANGE, 'status_update');

        await ch.consume(QUEUES.status, async (raw) => {
          if (!raw) return;
          try {
            const data = JSON.parse(raw.content.toString());
            this.logger.log(`Received status update via MQ: msgId=${data.messageId} status=${data.status}`);

            const extra: any = {};
            if (data.status === 'sent') extra.sentAt = data.timestamp;
            if (data.status === 'delivered') extra.deliveredAt = data.timestamp;
            if (data.status === 'read') extra.readAt = data.timestamp;
            if (data.status === 'failed') extra.failReason = data.errorReason;

            if (this.messagesService) {
              await this.messagesService.applyWebhookUpdate(data.messageId, data.status, extra);
            }
            ch.ack(raw);
          } catch (err) {
            this.logger.error('Failed to process status update', err);
            ch.nack(raw, false, false);
          }
        });

        this.logger.log('Channel topology and status consumer declared');
      },
    });

    await this.channel.waitForConnect();
  }

  /**
   * Publish a messageId to the pending queue so the worker can process it.
   */
  async publishMessage(messageId: string): Promise<void> {
    await this.channel.publish(
      EXCHANGE,
      'pending',
      { messageId },
      { deliveryMode: 2, messageId, timestamp: Date.now() } as any,
    );
    this.logger.debug(`Published messageId=${messageId}`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
