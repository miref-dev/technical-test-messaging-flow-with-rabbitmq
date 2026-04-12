import { Module, Global, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQModule.name);

  constructor(private readonly rabbit: RabbitMQService) { }

  async onModuleInit() {
    await this.rabbit.connect();
    this.logger.log('RabbitMQ module initialised');
  }

  async onModuleDestroy() {
    await this.rabbit.close();
  }
}
