import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';
import { RmqModule } from '@octonyah/shared-events';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(createValidationPipe());

  const rmqOptions: MicroserviceOptions = RmqModule.forMicroservice();

  app.connectMicroservice(rmqOptions);

  setupSwagger(app, {
    title: 'Octonyah Discovery Service',
    description: 'Public service for searching and exploring programs',
    version: '1.0',
    tags: [
      { name: 'Discovery', description: 'Public search and exploration endpoints' },
    ],
    path: 'api',
  });

  await app.startAllMicroservices();

  const port =
    configService.get<number>('DISCOVERY_PORT') ??
    configService.get<number>('PORT') ??
    configService.get<number>('PORT_DISCOVERY') ??
    3001;

  await app.listen(port);
  console.log(`Discovery service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}

bootstrap();


