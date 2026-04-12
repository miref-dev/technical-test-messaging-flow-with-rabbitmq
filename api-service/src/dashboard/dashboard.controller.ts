import {
  Controller,
  Get,
  Sse,
  MessageEvent,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OnEvent } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';
import { MessagesService } from '../messages/messages.service';
import type { Message, MessageStats } from '../common/types/message.types';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  private readonly events$ = new Subject<MessageEvent>();

  constructor(private readonly messagesService: MessagesService) { }

  @OnEvent('message.created')
  onMessageCreated(msg: Message) {
    this.push({ event: 'message:created', data: msg });
  }

  @OnEvent('message.status')
  onMessageStatus(msg: Message) {
    this.push({ event: 'message:status', data: msg });
  }

  @OnEvent('stats.update')
  onStatsUpdate(stats: MessageStats) {
    this.push({ event: 'stats:update', data: stats });
  }

  private push(payload: { event: string; data: unknown }) {
    this.events$.next({
      type: payload.event,
      data: JSON.stringify({ ...payload, ts: Date.now() }),
    });
  }

  // ── GET /api/dashboard/stats ───────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({
    summary: 'Get current message delivery stats',
    description: 'Returns a breakdown of messages by status. Suitable for dashboard widgets.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats snapshot',
    schema: {
      example: {
        total: 42,
        queued: 5,
        processing: 2,
        sent: 10,
        delivered: 20,
        read: 5,
        failed: 2,
      },
    },
  })
  async stats() {
    return await this.messagesService.stats();
  }

  // ── GET /api/dashboard/stream (SSE) ───────────────────────────────────────
  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time SSE event stream',
    description:
      'Server-Sent Events stream. Connect from the dashboard to receive live updates.\n\n' +
      'Events emitted:\n' +
      '- `message:created` — new message queued\n' +
      '- `message:status` — delivery status changed (sent/delivered/read/failed)\n' +
      '- `stats:update` — updated stats snapshot\n\n' +
      'Initial snapshot is sent on connection. Reconnects automatically.',
  })
  @ApiResponse({ status: 200, description: 'SSE stream (text/event-stream)' })
  stream(): Observable<MessageEvent> {
    this.logger.log('SSE client connected');

    // Send initial snapshot immediately on connect
    (async () => {
      try {
        const messages = await this.messagesService.list({ limit: 100 });
        const stats = await this.messagesService.stats();
        this.push({
          event: 'init', data: {
            messages,
            stats,
          }
        });
      } catch (err) {
        this.logger.error('Failed to send initial SSE snapshot', err);
      }
    })();

    return this.events$.asObservable();
  }
}
