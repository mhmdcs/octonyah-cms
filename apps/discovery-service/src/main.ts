import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const rmqUrl =
    configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
  const rmqQueue =
    configService.get<string>('RABBITMQ_QUEUE') || 'program-events';
  const prefetch = parseInt(
    configService.get<string>('RABBITMQ_PREFETCH') || '1',
    10,
  );

  const rmqOptions: MicroserviceOptions = {
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: rmqQueue,
      queueOptions: {
        durable: true,
      },
      prefetchCount: prefetch,
    },
  };

  app.connectMicroservice(rmqOptions);

  const config = new DocumentBuilder()
    .setTitle('Octonyah Discovery Service')
    .setDescription('Public service for searching and exploring programs')
    .setVersion('1.0')
    .addTag('Discovery', 'Public search and exploration endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();

  const port = configService.get<number>('DISCOVERY_PORT') ?? 
             configService.get<number>('PORT') ?? 
             configService.get<number>('PORT_DISCOVERY') ?? 
             3001;
             
  await app.listen(port);
  console.log(`Discovery service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}

bootstrap();


