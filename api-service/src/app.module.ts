import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { MessagesModule } from './messages/messages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './common/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    RabbitMQModule,
    MessagesModule,
    DashboardModule,
  ],
})
export class AppModule { }
