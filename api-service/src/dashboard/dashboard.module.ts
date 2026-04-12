import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
