import { createChannel, QUEUES, EXCHANGE } from './rabbitmq';
import type { ConsumeMessage } from 'amqplib';

const DELIVERY_SUCCESS_RATE = 0.3;

const FAIL_REASONS = [
  'Recipient unreachable',
  'Number not registered on WhatsApp',
  'Delivery timeout exceeded',
  'Spam filter rejection',
  'Opt-out: user blocked messages',
];

function pickFailReason(): string {
  return FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)]!;
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

let statusChannel: any;

async function updateStatus(messageId: string, status: string, errorReason?: string) {
  try {
    if (!statusChannel) {
      statusChannel = await createChannel();
    }
    await statusChannel.publish(EXCHANGE, 'status_update', {
      messageId,
      status,
      timestamp: new Date().toISOString(),
      errorReason
    }, { deliveryMode: 2 });
  } catch (error) {
    console.error(`[worker] Error publishing status for ${messageId}:`, error);
  }
}

export async function startWorker() {
  const channel = await createChannel();

  channel.addSetup(async (ch: import('amqplib').ConfirmChannel) => {
    await ch.consume(QUEUES.pending, async (raw: ConsumeMessage | null) => {
      if (!raw) return;

      let messageId: string | undefined;
      try {
        const payload = JSON.parse(raw.content.toString()) as { messageId: string };
        messageId = payload.messageId;
      } catch {
        console.error('[worker] Invalid message payload, discarding');
        ch.nack(raw, false, false);
        return;
      }

      console.log(`[worker] Processing message ${messageId}`);
      await randomDelay(1000, 6000);
      await updateStatus(messageId, 'processing');
      await randomDelay(2000, 6000);
      await updateStatus(messageId, 'sent');
      await randomDelay(4000, 8000);

      const success = Math.random() < DELIVERY_SUCCESS_RATE;

      if (success) {
        await updateStatus(messageId, 'delivered');
        console.log(`[worker] ✓✓ Delivered ${messageId}`);
        ch.ack(raw);
      } else {
        const reason = pickFailReason();
        await updateStatus(messageId, 'failed', reason);
        console.warn(`[worker] ✗ Failed ${messageId}: ${reason}`);
        ch.nack(raw, false, false);
      }
    });

    await ch.consume(QUEUES.dlq, (raw: ConsumeMessage | null) => {
      if (!raw) return;
      console.error('[DLQ] Dead-lettered message:', raw.content.toString());
      ch.ack(raw);
    });

    console.log('[worker] ✅ Consumer registered on', QUEUES.pending);
  });
}
