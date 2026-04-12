import amqp from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

export const EXCHANGE = 'messages.exchange';
export const QUEUES = {
  pending: 'messages.pending',
  dlq: 'messages.dlq',
} as const;

export const connection = amqp.connect([
  Bun.env.RABBITMQ_URL ?? 'amqp://localhost',
]);

connection.on('connect', () => console.log('[rabbitmq] connected'));
connection.on('disconnect', (err) => console.error('[rabbitmq] disconnected', err));

export async function createChannel() {
  const channel = connection.createChannel({
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
      await ch.prefetch(5);
    },
  });

  await channel.waitForConnect();
  return channel;
}