import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  SendMessageSchema,
  ListMessagesSchema,
  type SendMessageData,
  type ListMessagesQuery,
} from './messages.schema';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  // POST /api/messages
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ZodValidationPipe(SendMessageSchema))
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Creates a message and publishes it to RabbitMQ for async delivery.',
  })
  @ApiResponse({ status: 202, description: 'Message accepted and queued' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async send(@Body() data: SendMessageData) {
    const message = await this.messagesService.send(data);
    return { success: true, message };
  }

  // GET /api/messages
  @Get()
  @UsePipes(new ZodValidationPipe(ListMessagesSchema))
  @ApiOperation({
    summary: 'List messages',
    description: 'Returns messages, newest first. Supports filtering by receiver, status and type.',
  })
  @ApiResponse({ status: 200, description: 'Array of messages' })
  async list(@Query() query: ListMessagesQuery) {
    return await this.messagesService.list(query);
  }

  // GET /api/messages/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a single message by ID' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message object' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return await this.messagesService.findOne(id);
  }

  // PATCH /api/messages/:id/read
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a message as read',
  })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message updated to read' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async markRead(@Param('id') id: string) {
    return await this.messagesService.markRead(id);
  }

  // POST /api/messages/:id/resend
  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend a message',
    description: 'Resets a message back to queued state and re-triggers the delivery pipeline.',
  })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  @ApiResponse({ status: 200, description: 'Message resent' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async resend(@Param('id') id: string) {
    return await this.messagesService.resend(id);
  }
}
