import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageStore } from '../common/store/message.store';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessageStore],
  exports: [MessagesService, MessageStore],
})
export class MessagesModule {}
