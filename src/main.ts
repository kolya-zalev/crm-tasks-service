import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { HttpToRpcExceptionFilter, TASKS_QUEUE } from '@crm/shared';
import { TasksServiceModule } from './tasks-service.module';
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TasksServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_URL ?? 'amqp://localhost:5672'],
        queue: TASKS_QUEUE,
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  await app.listen();
  console.log('Tasks service working');
}

bootstrap();
