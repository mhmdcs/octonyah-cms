import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { createValidationPipe, setupSwagger } from '@octonyah/shared-config';
import { RmqModule } from '@octonyah/shared-events';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(createValidationPipe());

  const rmqOptions: MicroserviceOptions = RmqModule.forMicroservice();

  app.connectMicroservice(rmqOptions);

  setupSwagger(app, {
    specPath: path.join(__dirname, '../../openapi.yaml'),
    path: 'api',
  });

  await app.startAllMicroservices();

  const port =
    configService.get<number>('DISCOVERY_PORT') ??
    configService.get<number>('PORT') ??
    3001;

  await app.listen(port);
  console.log(`Discovery service running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);
}

bootstrap();
